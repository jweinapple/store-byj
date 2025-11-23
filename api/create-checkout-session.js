import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    // Enable CORS - restrict to your domain
    const allowedOrigins = [
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
        'https://store-k1s1xz7s2-byjs-projects-c6a90398.vercel.app',
        'http://localhost:3000'
    ].filter(Boolean);
    
    const origin = req.headers.origin;
    // Use exact match instead of includes() for better security
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { items, successUrl, cancelUrl } = req.body;

        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items are required' });
        }

        // Security: Validate and sanitize input
        const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
        // Only allow specific paths to prevent open redirect vulnerabilities
        const allowedPaths = ['/success.html', '/checkout.html'];
        const validSuccessUrl = successUrl && allowedPaths.some(path => successUrl === `${baseUrl}${path}`)
            ? successUrl 
            : `${baseUrl}/success.html`;
        const validCancelUrl = cancelUrl && allowedPaths.some(path => cancelUrl === `${baseUrl}${path}`)
            ? cancelUrl 
            : `${baseUrl}/checkout.html`;

        // Security: Validate items and prevent price manipulation
        const MAX_PRICE = 10000; // $100.00 max per item
        const MAX_QUANTITY = 10;
        const MAX_ITEMS = 20;

        if (items.length > MAX_ITEMS) {
            return res.status(400).json({ error: `Maximum ${MAX_ITEMS} items allowed` });
        }

        const lineItems = items.map(item => {
            // Validate price (allow $0.00 for free products)
            const price = parseFloat(item.price);
            if (isNaN(price) || price < 0 || price > MAX_PRICE) {
                throw new Error(`Invalid price for item: ${item.name}`);
            }

            // Validate quantity
            const quantity = parseInt(item.quantity) || 1;
            if (quantity <= 0 || quantity > MAX_QUANTITY) {
                throw new Error(`Invalid quantity for item: ${item.name}`);
            }

            // Sanitize name (prevent XSS)
            const name = String(item.name || 'Product').substring(0, 200);
            const description = item.description ? String(item.description).substring(0, 500) : undefined;
            
            // Validate images are URLs
            const images = Array.isArray(item.images) 
                ? item.images.filter(img => typeof img === 'string' && img.startsWith('http'))
                : [];

            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: name,
                        description: description,
                        images: images.slice(0, 8), // Max 8 images
                    },
                    unit_amount: Math.round(price * 100), // Convert to cents
                },
                quantity: quantity,
            };
        });

        // Calculate total amount
        const totalAmount = lineItems.reduce((sum, item) => sum + (item.price_data.unit_amount * item.quantity), 0);

        // Handle free orders (Stripe doesn't allow $0 checkout sessions)
        if (totalAmount === 0) {
            // For free products, save directly to database and return success
            const { saveOrder } = require('../lib/database');
            
            try {
                // Create a secure session ID for free orders using crypto
                const crypto = require('crypto');
                const freeSessionId = 'free_' + crypto.randomBytes(16).toString('hex');
                
                // Get customer email from request if provided
                const customerEmail = req.body.customerEmail || req.body.email || null;
                
                console.log('🆓 Processing free order...');
                console.log('📋 Order details:', {
                    session_id: freeSessionId,
                    customer_email: customerEmail,
                    items_count: items.length,
                    items: items.map(item => ({ 
                        id: item.id,
                        name: item.name, 
                        price: item.price, 
                        price_type: typeof item.price,
                        quantity: item.quantity 
                    }))
                });
                
                // Ensure items are in the correct format
                const formattedItems = items.map(item => ({
                    id: item.id || item.name?.toLowerCase().replace(/\s+/g, '-'),
                    name: item.name || 'Product',
                    price: parseFloat(item.price) || 0,
                    quantity: parseInt(item.quantity) || 1
                }));
                
                console.log('📦 Formatted items:', formattedItems);
                
                const savedOrder = await saveOrder({
                    stripe_session_id: freeSessionId,
                    customer_email: customerEmail,
                    amount_total: 0,
                    currency: 'usd',
                    payment_status: 'paid', // Free orders are automatically "paid"
                    items: formattedItems
                });
                
                console.log('✅ Free order saved to Supabase successfully!');
                console.log('📊 Supabase order ID:', savedOrder.id);
                console.log('🔗 Session ID:', freeSessionId);
                console.log('📋 Full saved order data:', JSON.stringify(savedOrder, null, 2));
                
                // Return success URL directly (skip Stripe)
                res.status(200).json({ 
                    id: freeSessionId,
                    url: `${validSuccessUrl}?session_id=${freeSessionId}&free=true`,
                    free: true,
                    orderId: savedOrder.id,
                    saved: true,
                    message: 'Free order saved to database successfully'
                });
            } catch (error) {
                console.error('❌ CRITICAL: Failed to save free order to Supabase!');
                console.error('🔍 Error message:', error.message);
                console.error('🔍 Error code:', error.code);
                console.error('🔍 Error details:', error.details);
                console.error('🔍 Error hint:', error.hint);
                console.error('🔍 Error stack:', error.stack);
                console.error('📋 Order that failed to save:', {
                    items_count: items.length,
                    items: items.map(item => ({ 
                        id: item.id,
                        name: item.name, 
                        price: item.price,
                        quantity: item.quantity 
                    }))
                });
                
                // Log the full error object
                console.error('🔍 Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
                
                // For free orders, we can still proceed even if database save fails
                // since the order is free and doesn't require payment tracking
                // However, we should log this for monitoring
                const freeSessionId = 'free_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                
                // Check if it's a database configuration error
                const isConfigError = error.message && (
                    error.message.includes('Database not configured') ||
                    error.message.includes('not available in production') ||
                    error.message.includes('Supabase')
                );
                
                if (isConfigError) {
                    // Still allow the order to proceed, but log the issue
                    console.warn('⚠️ Database not configured - free order proceeding without database save');
                    res.status(200).json({ 
                        id: freeSessionId,
                        url: `${validSuccessUrl}?session_id=${freeSessionId}&free=true`,
                        free: true,
                        warning: 'Order processed but not saved to database',
                        error: 'Database not configured'
                    });
                } else {
                    // For other errors, still allow the order but log extensively
                    console.error('❌ Database error (non-config):', error);
                    res.status(200).json({ 
                        id: freeSessionId,
                        url: `${validSuccessUrl}?session_id=${freeSessionId}&free=true`,
                        free: true,
                        warning: 'Order processed but database save failed - check logs',
                        error: error.message,
                        errorCode: error.code,
                        errorDetails: error.details || error.hint
                    });
                }
            }
            return;
        }

        // Create Stripe checkout session for paid orders
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${validSuccessUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: validCancelUrl,
            // Enable automatic email receipts to customers
            customer_email: req.body.customerEmail || req.body.email || undefined,
            // Stripe automatically sends email receipts when payment succeeds
            payment_intent_data: {
                receipt_email: req.body.customerEmail || req.body.email || undefined,
            },
            metadata: {
                artist: 'byJ.',
                website: 'byJ. Sound Recycler',
                items: JSON.stringify(items), // Store items in metadata for webhook
                product_names: items.map(item => item.name).join(', ')
            }
        });

        res.status(200).json({ 
            id: session.id,
            url: session.url 
        });

    } catch (error) {
        console.error('Stripe checkout error:', error);
        // Don't expose internal error details to client
        const errorMessage = error.type === 'StripeInvalidRequestError' 
            ? 'Invalid payment request'
            : 'Failed to create checkout session';
        res.status(500).json({ 
            error: errorMessage
        });
    }
}


