// Simple email notification helper for merchant notifications
// Uses SMTP (Gmail, SendGrid, Mailgun, etc.) configured via environment variables

import nodemailer from 'nodemailer';

// Create reusable transporter object
function createTransporter() {
    // Check if email is configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;
    
    if (!smtpHost || !smtpUser || !smtpPass) {
        console.log('⚠️ Email not configured - SMTP settings missing');
        return null;
    }
    
    return nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpPort == 465, // true for 465, false for other ports
        auth: {
            user: smtpUser,
            pass: smtpPass
        }
    });
}

// Helper function to format date in PST/PDT timezone
function formatDatePST(date = new Date()) {
    return date.toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    }) + ' PST/PDT';
}

// Send merchant notification email when checkout is completed
async function sendMerchantNotification(orderData) {
    const merchantEmail = process.env.MERCHANT_EMAIL;
    
    if (!merchantEmail) {
        console.log('⚠️ MERCHANT_EMAIL not configured - skipping email notification');
        return { sent: false, reason: 'MERCHANT_EMAIL not configured' };
    }
    
    const transporter = createTransporter();
    if (!transporter) {
        return { sent: false, reason: 'SMTP not configured' };
    }
    
    try {
        const itemsList = orderData.items
            .map(item => `  • ${item.name} (${item.quantity}x) - $${(item.price * item.quantity).toFixed(2)}`)
            .join('\n');
        
        const totalAmount = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const orderDatePST = formatDatePST();
        
        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: merchantEmail,
            subject: `🎵 New Order Received - $${totalAmount.toFixed(2)}`,
            text: `
New Order Received!

Order Details:
- Order ID: ${orderData.stripe_session_id}
- Customer Email: ${orderData.customer_email || 'Not provided'}
- Total Amount: $${totalAmount.toFixed(2)} ${orderData.currency?.toUpperCase() || 'USD'}
- Payment Status: ${orderData.payment_status}
- Order Time: ${orderDatePST}

Items:
${itemsList}

---
This is an automated notification from your store.
            `.trim(),
            html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .order-details { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .item { padding: 8px 0; border-bottom: 1px solid #eee; }
        .item:last-child { border-bottom: none; }
        .total { font-size: 18px; font-weight: bold; color: #667eea; margin-top: 15px; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">🎵 New Order Received!</h1>
        </div>
        <div class="content">
            <div class="order-details">
                <h3 style="margin-top: 0;">Order Details</h3>
                <p><strong>Order ID:</strong> ${orderData.stripe_session_id}</p>
                <p><strong>Customer Email:</strong> ${orderData.customer_email || 'Not provided'}</p>
                <p><strong>Payment Status:</strong> ${orderData.payment_status}</p>
                <p><strong>Order Time:</strong> ${orderDatePST}</p>
            </div>
            
            <div class="order-details">
                <h3>Items Ordered</h3>
                ${orderData.items.map(item => `
                    <div class="item">
                        <strong>${item.name}</strong> × ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}
                    </div>
                `).join('')}
                <div class="total">
                    Total: $${totalAmount.toFixed(2)} ${orderData.currency?.toUpperCase() || 'USD'}
                </div>
            </div>
            
            <div class="footer">
                <p>This is an automated notification from your store.</p>
            </div>
        </div>
    </div>
</body>
</html>
            `.trim()
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Merchant notification email sent:', info.messageId);
        return { sent: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send merchant notification email:', error);
        return { sent: false, error: error.message };
    }
}

export {
    sendMerchantNotification
};


