import { createOrder, getOrder, estimateShipping } from '../lib/printful.js';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        if (req.method === 'POST') {
            const { action, order_data, shipping_data } = req.body;

            if (action === 'create') {
                // Create order
                if (!order_data) {
                    res.status(400).json({ error: 'Missing order_data' });
                    return;
                }

                const order = await createOrder(order_data);
                res.status(200).json({ success: true, order });
            } else if (action === 'estimate_shipping') {
                // Estimate shipping
                if (!shipping_data) {
                    res.status(400).json({ error: 'Missing shipping_data' });
                    return;
                }

                const rates = await estimateShipping(shipping_data);
                res.status(200).json({ success: true, rates });
            } else {
                res.status(400).json({ error: 'Invalid action. Use "create" or "estimate_shipping"' });
            }
        } else if (req.method === 'GET') {
            // Get order status
            const { order_id } = req.query;

            if (!order_id) {
                res.status(400).json({ error: 'Missing order_id parameter' });
                return;
            }

            const order = await getOrder(order_id);
            res.status(200).json({ success: true, order });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error with Printful order:', error);
        res.status(500).json({ 
            error: 'Failed to process order', 
            message: error.message 
        });
    }
}

