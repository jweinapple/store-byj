import { getProducts, getProductVariants } from '../lib/printful.js';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { product_id, category_id } = req.query;

        if (product_id) {
            // Get specific product with variants (v1 - v2 catalog not available yet)
            const product = await getProductVariants(product_id);
            // V1 returns { result: {...} }, wrap it for consistency
            res.status(200).json({ success: true, product: product });
        } else {
            // Get all products or products by category (v1 - v2 catalog not available yet)
            const products = await getProducts(category_id || null);
            res.status(200).json({ success: true, products });
        }
    } catch (error) {
        console.error('Error fetching Printful products:', error);
        res.status(500).json({ 
            error: 'Failed to fetch products', 
            message: error.message 
        });
    }
}

