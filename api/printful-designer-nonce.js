import { generateDesignerNonce, getDesignByNonce } from '../lib/printful.js';

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
            // Generate nonce token
            const { external_product_id, external_customer_id } = req.body;

            if (!external_product_id) {
                res.status(400).json({ 
                    error: 'Missing required field: external_product_id' 
                });
                return;
            }

            const result = await generateDesignerNonce(
                external_product_id,
                external_customer_id || null
            );

            res.status(200).json({ 
                success: true, 
                nonce: result.nonce,
                expires_at: result.expires_at
            });
        } else if (req.method === 'GET') {
            // Get design by nonce
            const { nonce } = req.query;

            if (!nonce) {
                res.status(400).json({ error: 'Missing nonce parameter' });
                return;
            }

            const design = await getDesignByNonce(nonce);
            res.status(200).json({ success: true, design });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error with Printful designer:', error);
        
        // Check if it's a 404 - means EDM access is not available
        const errorMessage = error.message || '';
        const is404Error = errorMessage.includes('404') || 
                          errorMessage.includes('Not Found') ||
                          errorMessage.includes('NotFound');
        
        if (is404Error) {
            res.status(403).json({ 
                error: 'Embedded Design Maker access required', 
                message: 'The Printful Embedded Design Maker requires special enterprise access. Please request access at https://developers.printful.com/docs/edm/ or contact Printful support.',
                requiresAccess: true
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to process designer request', 
                message: error.message 
            });
        }
    }
}

