import { createMockup, getMockupTask } from '../lib/printful.js';

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
            // Create mockup task
            const { variant_ids, format, width, files } = req.body;

            if (!variant_ids || !files) {
                res.status(400).json({ 
                    error: 'Missing required fields: variant_ids, files' 
                });
                return;
            }

            const mockupData = {
                variant_ids: Array.isArray(variant_ids) ? variant_ids : [variant_ids],
                format: format || 'jpg',
                width: width || 1000,
                files: Array.isArray(files) ? files : [files]
            };

            const result = await createMockup(mockupData);
            res.status(200).json({ success: true, task_key: result.task_key });
        } else if (req.method === 'GET') {
            // Get mockup task status
            const { task_key } = req.query;

            if (!task_key) {
                res.status(400).json({ error: 'Missing task_key parameter' });
                return;
            }

            const task = await getMockupTask(task_key);
            res.status(200).json({ success: true, task });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error with Printful mockup:', error);
        res.status(500).json({ 
            error: 'Failed to process mockup request', 
            message: error.message 
        });
    }
}

