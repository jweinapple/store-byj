import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { session_id } = req.query;
        
        if (!session_id) {
            return res.status(400).json({ error: 'Session ID is required' });
        }
        
        const session = await stripe.checkout.sessions.retrieve(session_id);
        
        res.status(200).json({
            amount_total: session.amount_total / 100, // Convert cents to dollars
            currency: session.currency,
            payment_status: session.payment_status,
            customer_email: session.customer_details?.email
        });
    } catch (error) {
        console.error('Error fetching session details:', error);
        res.status(500).json({ error: 'Failed to fetch session details' });
    }
}
