import Stripe from 'stripe';
import { saveOrder, createDigitalAccess } from '../lib/database.js';
import { sendMerchantNotification } from '../lib/email.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ⚠️ CRITICAL: Disable body parsing to get raw body for Stripe signature verification
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    // Handle preflight requests
    // Note: Webhooks don't need CORS - they're called by Stripe servers, not browsers
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Check if we have the required environment variables
    if (!endpointSecret) {
        console.error('❌ Missing STRIPE_WEBHOOK_SECRET environment variable');
        return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    if (!sig) {
        console.error('❌ Missing Stripe signature header');
        return res.status(400).json({ error: 'Missing Stripe signature' });
    }

    let event;

    try {
        // ⚠️ CRITICAL: Read the raw body
        // For Vercel: use micro's buffer function
        // For local Express: use req.body (already parsed as raw buffer)
        let rawBody;
        if (req.buffer) {
            // Vercel environment - use micro buffer
            rawBody = await req.buffer();
        } else if (Buffer.isBuffer(req.body)) {
            // Express with raw body parser
            rawBody = req.body;
        } else {
            throw new Error('Raw body not available - ensure bodyParser is disabled for webhook routes');
        }
        
        if (!rawBody || rawBody.length === 0) {
            throw new Error('Raw body is empty or could not be read');
        }
        
        console.log('✅ Read raw body using micro buffer');
        console.log('📏 Raw body length:', rawBody.length);
        console.log('📋 Raw body preview (first 100 chars):', rawBody.toString('utf8').substring(0, 100));
        
        // Verify webhook signature with the raw body
        event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
        console.log('✅ Webhook signature verified successfully');
        console.log('📋 Event type:', event.type);
        console.log('🆔 Event ID:', event.id);
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        console.error('🔍 Debug info:', {
            hasSignature: !!sig,
            hasSecret: !!endpointSecret,
            bodyType: typeof req.body,
            isBuffer: Buffer.isBuffer(req.body),
            hasRawBody: !!req.rawBody,
            isReadable: req.readable,
            contentType: req.headers['content-type'],
            signatureHeader: sig ? sig.substring(0, 20) + '...' : null,
            bodyPreview: typeof req.body === 'string' ? req.body.substring(0, 100) : (typeof req.body === 'object' ? 'Parsed JSON object' : 'Unknown')
        });
        
        // Return error - signature verification is critical for security
        return res.status(400).json({ 
            error: `Webhook signature verification failed: ${err.message}`,
            message: 'The request body may have been parsed by Vercel before signature verification',
            troubleshooting: [
                '1. Ensure STRIPE_WEBHOOK_SECRET matches the webhook endpoint secret in Stripe Dashboard',
                '2. Verify that bodyParser: false is set in the export const config',
                '3. Check that the micro package is installed (npm install micro)',
                '4. Verify the webhook endpoint URL in Stripe Dashboard matches: https://byj.vercel.app/api/stripe-webhook',
                '5. Try sending a test webhook from Stripe Dashboard',
                '6. Redeploy the function after making changes'
            ]
        });
    }

    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                console.log('✅ Checkout completed:', session.id);
                console.log('📧 Customer email:', session.customer_details?.email);
                console.log('💰 Amount:', session.amount_total, session.currency);
                
                // Get items from metadata (we store it there in create-checkout-session)
                let items = [];
                if (session.metadata && session.metadata.items) {
                    try {
                        items = JSON.parse(session.metadata.items);
                        console.log('📦 Items from metadata:', items);
                    } catch (e) {
                        console.error('❌ Failed to parse metadata items:', e.message);
                        // Fallback: try to retrieve line items from Stripe
                        try {
                            const sessionWithItems = await stripe.checkout.sessions.retrieve(session.id, {
                                expand: ['line_items']
                            });
                            if (sessionWithItems.line_items?.data) {
                                items = sessionWithItems.line_items.data.map(item => ({
                                    id: item.price?.product || 'unknown',
                                    name: item.description || item.price?.product_data?.name || 'Product',
                                    price: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
                                    quantity: item.quantity || 1
                                }));
                                console.log('📦 Items retrieved from Stripe API:', items);
                            }
                        } catch (retrieveErr) {
                            console.error('❌ Failed to retrieve line items:', retrieveErr.message);
                            // Final fallback
                            items = [{
                                name: session.metadata?.product_names || 'Product',
                                price: session.amount_total / 100,
                                quantity: 1
                            }];
                        }
                    }
                } else {
                    // No metadata, try to retrieve from Stripe
                    try {
                        const sessionWithItems = await stripe.checkout.sessions.retrieve(session.id, {
                            expand: ['line_items']
                        });
                        if (sessionWithItems.line_items?.data) {
                            items = sessionWithItems.line_items.data.map(item => ({
                                id: item.price?.product || 'unknown',
                                name: item.description || item.price?.product_data?.name || 'Product',
                                price: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
                                quantity: item.quantity || 1
                            }));
                            console.log('📦 Items retrieved from Stripe API:', items);
                        }
                    } catch (retrieveErr) {
                        console.error('❌ Failed to retrieve line items:', retrieveErr.message);
                        items = [{
                            name: session.metadata?.product_names || 'Product',
                            price: session.amount_total / 100,
                            quantity: 1
                        }];
                    }
                }
                
                // Save to database using the database helper (Supabase)
                try {
                    console.log('💾 Saving paid order to Supabase...');
                    console.log('📋 Order details:', {
                        session_id: session.id,
                        email: session.customer_details?.email,
                        amount: session.amount_total / 100,
                        currency: session.currency,
                        status: session.payment_status,
                        items_count: items.length
                    });
                    
                    const savedOrder = await saveOrder({
                        stripe_session_id: session.id,
                        customer_email: session.customer_details?.email,
                        amount_total: session.amount_total / 100, // Convert cents to dollars
                        currency: session.currency,
                        payment_status: session.payment_status,
                        items: items
                    });
                    
                    console.log('✅ Order saved to Supabase successfully!');
                    console.log('📊 Supabase order ID:', savedOrder.id);
                    console.log('🔗 Session ID:', session.id);
                    
                    // Create digital access tokens for digital products
                    let digitalAccessCount = 0;
                    for (const item of items) {
                        const itemId = item.id || item.name.toLowerCase().replace(/\s+/g, '-');
                        if (itemId.includes('sample-pack') || 
                            item.name.toLowerCase().includes('sample pack')) {
                            const crypto = require('crypto');
                            const downloadToken = crypto.randomBytes(32).toString('hex');
                            const expiresAt = new Date();
                            expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now
                            
                            try {
                                await createDigitalAccess({
                                    order_id: savedOrder.id,
                                    stripe_session_id: session.id,
                                    customer_email: session.customer_details?.email,
                                    product_id: itemId,
                                    download_token: downloadToken,
                                    expires_at: expiresAt.toISOString()
                                });
                                console.log('🔑 Digital access token created for:', item.name);
                                digitalAccessCount++;
                            } catch (err) {
                                console.error('❌ Failed to create digital access for', item.name, ':', err.message);
                                console.error('🔍 Error details:', err);
                            }
                        }
                    }
                    
                    if (digitalAccessCount > 0) {
                        console.log(`✅ Created ${digitalAccessCount} digital access token(s)`);
                    }
                } catch (dbError) {
                    console.error('❌ CRITICAL: Failed to save paid order to Supabase!');
                    console.error('🔍 Error message:', dbError.message);
                    console.error('🔍 Error stack:', dbError.stack);
                    console.error('📋 Order that failed to save:', {
                        session_id: session.id,
                        email: session.customer_details?.email,
                        amount: session.amount_total / 100,
                        items: items
                    });
                    // Note: We don't throw here to avoid webhook retries, but we log extensively
                    // The order is still processed by Stripe, just not tracked in our database
                }
                
                // Send merchant notification email (regardless of database save status)
                try {
                    console.log('📧 Sending merchant notification email...');
                    const emailResult = await sendMerchantNotification({
                        stripe_session_id: session.id,
                        customer_email: session.customer_details?.email,
                        amount_total: session.amount_total / 100,
                        currency: session.currency,
                        payment_status: session.payment_status,
                        items: items
                    });
                    
                    if (emailResult.sent) {
                        console.log('✅ Merchant notification email sent successfully');
                    } else {
                        console.log('⚠️ Merchant notification email not sent:', emailResult.reason || emailResult.error);
                    }
                } catch (emailError) {
                    console.error('❌ Failed to send merchant notification email:', emailError.message);
                    // Don't throw - email failure shouldn't break the webhook
                }
                
                break;
                
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                console.log('💳 Payment succeeded:', paymentIntent.id);
                console.log('💰 Amount:', paymentIntent.amount, paymentIntent.currency);
                
                // Update order status to paid
                console.log('✅ Order marked as paid');
                
                // TODO: Update database order status
                // TODO: Send payment confirmation
                // TODO: Trigger shipping/fulfillment
                
                break;
                
            case 'checkout.session.expired':
                const expiredSession = event.data.object;
                console.log('⏰ Checkout expired:', expiredSession.id);
                
                // Track abandoned cart
                console.log('🛒 Abandoned cart tracked');
                
                // TODO: Save abandoned cart data
                // TODO: Send follow-up email
                // TODO: Track conversion metrics
                
                break;
                
            case 'payment_intent.payment_failed':
                const failedPayment = event.data.object;
                console.log('❌ Payment failed:', failedPayment.id);
                console.log('💸 Payment failure reason:', failedPayment.last_payment_error?.message);
                console.log('🔍 Error code:', failedPayment.last_payment_error?.code);
                
                // Handle payment failure
                console.log('🔄 Handling payment failure...');
                
                // TODO: Notify customer of failure
                // TODO: Offer retry options
                // TODO: Update order status
                
                break;
                
            default:
                console.log(`ℹ️ Unhandled event type: ${event.type}`);
                console.log('📋 Event data:', JSON.stringify(event.data, null, 2));
        }
    } catch (eventError) {
        console.error('❌ Error processing event:', eventError.message);
        console.error('🔍 Event that caused error:', JSON.stringify(event, null, 2));
        // Don't return error here - we still want to acknowledge receipt
    }

    // Set proper headers and return success response
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ 
        received: true, 
        eventType: event.type,
        timestamp: new Date().toISOString()
    });
}
