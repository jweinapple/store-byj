/**
 * Test Script for Printful Order Fulfillment API
 * 
 * This script helps you test order creation and fulfillment via the Printful API.
 * 
 * Usage:
 *   node test-printful-order.js create    - Create a test order
 *   node test-printful-order.js status <order_id>  - Check order status
 *   node test-printful-order.js estimate  - Estimate shipping costs
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// Test order data structure
const testOrderData = {
    external_id: `test_order_${Date.now()}`,
    recipient: {
        name: "John Doe",
        address1: "123 Test Street",
        city: "Los Angeles",
        state_code: "CA",
        country_code: "US",
        zip: "90001"
    },
    items: [
        {
            variant_id: 4011, // Example: Gildan 64000 Unisex Softstyle T-Shirt - White / S
            quantity: 1,
            files: [
                {
                    type: "default",
                    url: "https://example.com/design.png" // Replace with actual design URL
                }
            ]
        }
    ],
    // IMPORTANT: Set to true for test mode (won't actually fulfill)
    confirm: false, // Set to false for test, true for actual fulfillment
    shipping: "STANDARD"
};

// Test shipping estimation data
const testShippingData = {
    recipient: {
        address1: "123 Test Street",
        city: "Los Angeles",
        state_code: "CA",
        country_code: "US",
        zip: "90001"
    },
    items: [
        {
            variant_id: 4011,
            quantity: 1
        }
    ]
};

async function createTestOrder() {
    console.log('🧪 Creating test order...\n');
    console.log('Order Data:', JSON.stringify(testOrderData, null, 2));
    
    try {
        const response = await fetch(`${API_BASE}/api/printful-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'create',
                order_data: testOrderData
            })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ Order created successfully!\n');
            console.log('Order ID:', data.order.id);
            console.log('External ID:', data.order.external_id);
            console.log('Status:', data.order.status);
            console.log('\nFull Order Response:');
            console.log(JSON.stringify(data.order, null, 2));
            
            if (!testOrderData.confirm) {
                console.log('\n⚠️  NOTE: This is a TEST order (confirm: false).');
                console.log('   No actual fulfillment will occur.');
                console.log('   Set confirm: true to create a real order.');
            }
        } else {
            console.error('❌ Error creating order:');
            console.error(data);
        }
    } catch (error) {
        console.error('❌ Request failed:', error.message);
    }
}

async function checkOrderStatus(orderId) {
    console.log(`🔍 Checking status for order: ${orderId}\n`);
    
    try {
        const response = await fetch(`${API_BASE}/api/printful-order?order_id=${orderId}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ Order Status:\n');
            console.log('Order ID:', data.order.id);
            console.log('External ID:', data.order.external_id);
            console.log('Status:', data.order.status);
            console.log('Created:', data.order.created);
            
            if (data.order.shipments && data.order.shipments.length > 0) {
                console.log('\n📦 Shipments:');
                data.order.shipments.forEach((shipment, i) => {
                    console.log(`  Shipment ${i + 1}:`);
                    console.log(`    Status: ${shipment.status}`);
                    console.log(`    Tracking: ${shipment.tracking_number || 'N/A'}`);
                    console.log(`    Carrier: ${shipment.carrier || 'N/A'}`);
                });
            }
            
            console.log('\nFull Order Data:');
            console.log(JSON.stringify(data.order, null, 2));
        } else {
            console.error('❌ Error fetching order:');
            console.error(data);
        }
    } catch (error) {
        console.error('❌ Request failed:', error.message);
    }
}

async function estimateShipping() {
    console.log('💰 Estimating shipping costs...\n');
    console.log('Shipping Data:', JSON.stringify(testShippingData, null, 2));
    
    try {
        const response = await fetch(`${API_BASE}/api/printful-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'estimate_shipping',
                shipping_data: testShippingData
            })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ Shipping Rates:\n');
            if (data.rates && data.rates.length > 0) {
                data.rates.forEach((rate, i) => {
                    console.log(`Option ${i + 1}:`);
                    console.log(`  Name: ${rate.name}`);
                    console.log(`  Rate: $${rate.rate}`);
                    console.log(`  Currency: ${rate.currency}`);
                    console.log(`  Min Days: ${rate.minDeliveryDays || 'N/A'}`);
                    console.log(`  Max Days: ${rate.maxDeliveryDays || 'N/A'}`);
                    console.log('');
                });
            } else {
                console.log('No shipping rates available');
            }
        } else {
            console.error('❌ Error estimating shipping:');
            console.error(data);
        }
    } catch (error) {
        console.error('❌ Request failed:', error.message);
    }
}

// Main execution
const command = process.argv[2];
const orderId = process.argv[3];

if (command === 'create') {
    createTestOrder();
} else if (command === 'status') {
    if (!orderId) {
        console.error('❌ Please provide an order ID');
        console.log('Usage: node test-printful-order.js status <order_id>');
        process.exit(1);
    }
    checkOrderStatus(orderId);
} else if (command === 'estimate') {
    estimateShipping();
} else {
    console.log('Printful Order API Test Script\n');
    console.log('Usage:');
    console.log('  node test-printful-order.js create              - Create a test order');
    console.log('  node test-printful-order.js status <order_id>   - Check order status');
    console.log('  node test-printful-order.js estimate            - Estimate shipping\n');
    console.log('Environment:');
    console.log('  API_BASE - API base URL (default: http://localhost:3000)');
    console.log('\n⚠️  IMPORTANT:');
    console.log('  - Test orders use confirm: false (no actual fulfillment)');
    console.log('  - Set confirm: true in testOrderData to create real orders');
    console.log('  - Make sure PRINTFUL_OAUTH_TOKEN is set in your environment');
    console.log('  - Update variant_id and design URL in testOrderData before testing');
}

