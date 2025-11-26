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
            
            // Ensure products is an array
            if (!Array.isArray(products)) {
                console.error('Products is not an array:', products);
                res.status(500).json({ 
                    success: false,
                    error: 'Invalid products response format', 
                    message: 'Products data is not in expected format'
                });
                return;
            }
            
            res.status(200).json({ success: true, products });
        }
    } catch (error) {
        console.error('Error fetching Printful products:', error);
        
        // Check if it's an authentication error
        const isAuthError = error.message && (
            error.message.includes('OAuth token') || 
            error.message.includes('unauthorized') ||
            error.message.includes('401') ||
            error.message.includes('authentication')
        );
        
        res.status(500).json({ 
            success: false,
            error: isAuthError ? 'Authentication failed' : 'Failed to fetch products', 
            message: error.message || 'Unknown error occurred',
            requiresAuth: isAuthError
        });
    }
}

