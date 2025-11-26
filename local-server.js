import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());

// JSON and URL-encoded parsers for most routes (excluding webhook)
app.use((req, res, next) => {
    if (req.path === '/api/stripe-webhook') {
        return next();
    }
    express.json()(req, res, next);
});

app.use((req, res, next) => {
    if (req.path === '/api/stripe-webhook') {
        return next();
    }
    express.urlencoded({ extended: true })(req, res, next);
});

// Helper function to create a buffer-like function for webhook
function createBufferFunction(req) {
    return async function buffer() {
        if (Buffer.isBuffer(req.body)) {
            return req.body;
        }
        if (typeof req.body === 'string') {
            return Buffer.from(req.body, 'utf8');
        }
        return Buffer.from(JSON.stringify(req.body || {}), 'utf8');
    };
}

// Helper function to load and execute API handlers
async function loadHandler(handlerPath, req, res) {
    try {
        // Dynamic import for ES modules
        const handlerModule = await import(handlerPath);
        const handler = handlerModule.default;
        
        // For webhook routes, provide buffer function
        let bufferFn = null;
        if (req.url.includes('stripe-webhook')) {
            bufferFn = createBufferFunction(req);
        }
        
        // Create a mock req/res that matches Vercel's format
        const vercelReq = {
            method: req.method,
            headers: req.headers,
            body: req.body,
            query: req.query,
            url: req.url,
            // Add buffer function for webhook
            ...(bufferFn && { buffer: bufferFn })
        };
        
        const vercelRes = {
            statusCode: 200,
            headers: {},
            setHeader: function(key, value) {
                this.headers[key] = value;
                res.setHeader(key, value);
            },
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                res.status(this.statusCode).json(data);
            },
            end: function() {
                res.status(this.statusCode).end();
            }
        };
        
        // Execute the handler
        await handler(vercelReq, vercelRes);
    } catch (error) {
        console.error('Error loading handler:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}

// API Routes
app.all('/api/spotify-discography', async (req, res) => {
    await loadHandler('./api/spotify-discography.js', req, res);
});

app.all('/api/spotify-latest', async (req, res) => {
    await loadHandler('./api/spotify-latest.js', req, res);
});

app.all('/api/spotify-random-track', async (req, res) => {
    await loadHandler('./api/spotify-random-track.js', req, res);
});

app.all('/api/create-checkout-session', async (req, res) => {
    await loadHandler('./api/create-checkout-session.js', req, res);
});

// Webhook route needs raw body - use express.raw middleware
app.all('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    await loadHandler('./api/stripe-webhook.js', req, res);
});

app.all('/api/stripe-publishable-key', async (req, res) => {
    await loadHandler('./api/stripe-publishable-key.js', req, res);
});

app.all('/api/get-session-details', async (req, res) => {
    await loadHandler('./api/get-session-details.js', req, res);
});

app.all('/api/printful-products', async (req, res) => {
    await loadHandler('./api/printful-products.js', req, res);
});

app.all('/api/printful-mockup', async (req, res) => {
    await loadHandler('./api/printful-mockup.js', req, res);
});

app.all('/api/printful-order', async (req, res) => {
    await loadHandler('./api/printful-order.js', req, res);
});

app.all('/api/printful-designer-nonce', async (req, res) => {
    await loadHandler('./api/printful-designer-nonce.js', req, res);
});

// Proxy Vite dev server requests BEFORE static file serving
// This must come before static file serving to work correctly
const viteProxyOptions = {
    target: 'http://localhost:5173',
    changeOrigin: true,
    ws: true, // Enable websocket proxying for HMR
    logLevel: 'silent'
};

// Proxy all Vite dev server assets FIRST (before any other routes)
// Use app.all() to catch all HTTP methods
app.all('/@vite*', createProxyMiddleware(viteProxyOptions));
app.all('/@react-refresh*', createProxyMiddleware(viteProxyOptions));
app.all('/src*', createProxyMiddleware(viteProxyOptions));
app.all('/node_modules*', createProxyMiddleware(viteProxyOptions));

// Serve printful demo page
app.get('/printful-demo', (req, res) => {
    res.sendFile(path.join(__dirname, 'printful-demo.html'));
});

// Serve Printful API designer page
app.get('/printful-api-designer', (req, res) => {
    res.sendFile(path.join(__dirname, 'printful-api-designer.html'));
});

// Serve merch designer page
app.get('/merch-designer', (req, res) => {
    res.sendFile(path.join(__dirname, 'merch-designer.html'));
});

// Legacy route for designer (redirects to merch-designer)
app.get('/designer', (req, res) => {
    res.sendFile(path.join(__dirname, 'merch-designer.html'));
});

// Fallback: serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve static files (after specific routes and proxies)
// Skip static serving for paths that should be proxied to Vite
app.use((req, res, next) => {
    const vitePaths = [
        '/src',
        '/@vite',
        '/@react-refresh',
        '/node_modules'
    ];
    
    // Skip static serving for Vite paths - they're proxied
    if (vitePaths.some(path => req.path.startsWith(path))) {
        return next();
    }
    express.static(__dirname)(req, res, next);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Local server running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`🔌 API endpoints available at: http://localhost:${PORT}/api/*`);
});
