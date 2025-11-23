// Printful API helper functions

const PRINTFUL_API_URL = 'https://api.printful.com';
const PRINTFUL_API_V2_URL = 'https://api.printful.com/v2';
const PRINTFUL_STORE_API_URL = 'https://api.printful.com/stores';

// Get Printful API credentials from environment
function getPrintfulCredentials() {
    // Printful now requires OAuth 2.0 Bearer tokens (Basic Auth is deprecated)
    // Get OAuth token from environment
    const oauthToken = process.env.PRINTFUL_OAUTH_TOKEN || 
                      process.env.PRINTFUL_API_KEY; // Fallback for backwards compatibility
    
    if (!oauthToken) {
        throw new Error('Printful OAuth token not configured. Please set PRINTFUL_OAUTH_TOKEN environment variable. ' +
            'Get your OAuth token from https://developers.printful.com/');
    }
    
    // Remove 'Bearer ' prefix if present
    const token = oauthToken.replace(/^Bearer\s+/i, '');
    
    return {
        token: token,
        auth: `Bearer ${token}`,
        authType: 'Bearer'
    };
}

// Make authenticated request to Printful API
async function printfulRequest(endpoint, options = {}, useV2 = false) {
    const credentials = getPrintfulCredentials();
    const baseUrl = useV2 ? PRINTFUL_API_V2_URL : PRINTFUL_API_URL;
    const url = `${baseUrl}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Authorization': credentials.auth,
            'Content-Type': 'application/json'
        }
    };
    
    // Add store ID header if provided
    if (process.env.PRINTFUL_STORE_ID) {
        defaultOptions.headers['X-PF-Store-Id'] = process.env.PRINTFUL_STORE_ID;
    }
    
    const requestOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };
    
    // Handle body for POST/PUT requests
    if (options.body && typeof options.body === 'object') {
        requestOptions.body = JSON.stringify(options.body);
    }
    
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
        const errorText = await response.text();
        let error;
        try {
            error = JSON.parse(errorText);
        } catch {
            error = { message: errorText || response.statusText };
        }
        console.error('Printful API Error:', {
            status: response.status,
            statusText: response.statusText,
            url: url,
            error: error
        });
        throw new Error(`Printful API error: ${error.message || error.result || response.statusText} (${response.status})`);
    }
    
    return await response.json();
}

// Get all products from Printful catalog (v1 - v2 catalog not available yet)
async function getProducts(categoryId = null, limit = 100) {
    try {
        let endpoint = `/catalog/products?limit=${limit}`;
        if (categoryId) {
            endpoint += `&category_id=${categoryId}`;
        }
        
        // Note: Catalog v2 endpoints return 404, using v1 for now
        const response = await printfulRequest(endpoint, {}, false);
        // V1 response structure: { result: { products: [...], pagination: {...} } }
        return response.result?.products || [];
    } catch (error) {
        console.error('Error fetching Printful products:', error);
        throw error;
    }
}

// Get product variants (sizes, colors, etc.) - v1 (v2 catalog not available yet)
async function getProductVariants(productId) {
    try {
        // Note: Catalog v2 endpoints return 404, using v1 for now
        const response = await printfulRequest(`/catalog/products/${productId}`, {}, false);
        // V1 response structure: { result: { product: {...} } }
        return response.result?.product || response.result || null;
    } catch (error) {
        console.error('Error fetching product variants:', error);
        throw error;
    }
}

// Generate mockup image (v2)
async function createMockup(mockupData) {
    try {
        // V2 endpoint: POST /v2/mockup-generator/tasks
        const response = await printfulRequest('/mockup-generator/tasks', {
            method: 'POST',
            body: mockupData
        }, true);
        // V2 response structure: { data: {...}, extra: [] }
        return response.data || null;
    } catch (error) {
        console.error('Error creating mockup:', error);
        throw error;
    }
}

// Get mockup task status (v2)
async function getMockupTask(taskKey) {
    try {
        // V2 endpoint: GET /v2/mockup-generator/tasks/{task_key}
        const response = await printfulRequest(`/mockup-generator/tasks/${taskKey}`, {}, true);
        // V2 response structure: { data: {...}, extra: [] }
        return response.data || null;
    } catch (error) {
        console.error('Error fetching mockup task:', error);
        throw error;
    }
}

// Create an order in Printful (v2)
async function createOrder(orderData) {
    try {
        // V2 endpoint: POST /v2/orders
        // V2 uses different structure - items instead of items array with different format
        const response = await printfulRequest('/orders', {
            method: 'POST',
            body: orderData
        }, true);
        // V2 response structure: { data: {...}, extra: [] }
        return response.data || null;
    } catch (error) {
        console.error('Error creating Printful order:', error);
        throw error;
    }
}

// Get order status
async function getOrder(orderId) {
    try {
        const response = await printfulRequest(`/orders/@${orderId}`);
        return response.result || null;
    } catch (error) {
        console.error('Error fetching order:', error);
        throw error;
    }
}

// Estimate shipping costs (v2)
async function estimateShipping(shippingData) {
    try {
        // V2 endpoint: POST /v2/shipping-rates
        const response = await printfulRequest('/shipping-rates', {
            method: 'POST',
            body: shippingData
        }, true);
        // V2 response structure: { data: {...}, extra: [] }
        return response.data || null;
    } catch (error) {
        console.error('Error estimating shipping:', error);
        throw error;
    }
}

// Generate nonce token for Embedded Design Maker
async function generateDesignerNonce(externalProductId, externalCustomerId = null) {
    try {
        const payload = {
            external_product_id: externalProductId
        };
        
        if (externalCustomerId) {
            payload.external_customer_id = externalCustomerId;
        }
        
        const response = await printfulRequest('/embedded-designer/nonces', {
            method: 'POST',
            body: payload
        });
        return response.result || null;
    } catch (error) {
        console.error('Error generating designer nonce:', error);
        throw error;
    }
}

// Get design by nonce
async function getDesignByNonce(nonce) {
    try {
        const response = await printfulRequest(`/embedded-designer/designs?nonce=${encodeURIComponent(nonce)}`);
        return response.result || null;
    } catch (error) {
        console.error('Error fetching design by nonce:', error);
        throw error;
    }
}

export {
    getProducts,
    getProductVariants,
    createMockup,
    getMockupTask,
    createOrder,
    getOrder,
    estimateShipping,
    generateDesignerNonce,
    getDesignByNonce,
    printfulRequest
};

