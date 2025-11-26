# How to Use Printful API on Your Site

## Available API Endpoints

All endpoints are accessible from your frontend JavaScript. The API key is securely stored server-side.

### 1. Fetch Products

**Endpoint:** `GET /api/printful-products`

**Usage:**
```javascript
// Get all products
const response = await fetch('/api/printful-products');
const data = await response.json();
console.log(data.products); // Array of products

// Get specific product with variants
const response = await fetch('/api/printful-products?product_id=71');
const data = await response.json();
console.log(data.product); // Product with all variants
```

**Example Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": 71,
      "name": "Gildan 64000 Unisex Softstyle T-Shirt",
      "type": "T-SHIRT",
      "currency": "USD",
      "description": "..."
    }
  ]
}
```

### 2. Generate Mockups

**Endpoint:** `POST /api/printful-mockup`

**Usage:**
```javascript
// Step 1: Create mockup task
const response = await fetch('/api/printful-mockup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    variant_ids: [4011], // Product variant ID
    files: [{
      url: 'https://example.com/your-design.png' // Your design image URL
    }],
    format: 'jpg',
    width: 1000
  })
});

const { task_key } = await response.json();

// Step 2: Poll for mockup status
const checkStatus = async () => {
  const statusResponse = await fetch(`/api/printful-mockup?task_key=${task_key}`);
  const statusData = await statusResponse.json();
  
  if (statusData.task.status === 'completed') {
    // Mockup is ready!
    const mockupUrl = statusData.task.mockups[0].url;
    console.log('Mockup URL:', mockupUrl);
  } else {
    // Still processing, check again in 2 seconds
    setTimeout(checkStatus, 2000);
  }
};

checkStatus();
```

### 3. Estimate Shipping

**Endpoint:** `POST /api/printful-order` (with `action: "estimate_shipping"`)

**Usage:**
```javascript
const response = await fetch('/api/printful-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'estimate_shipping',
    shipping_data: {
      recipient: {
        country_code: 'US',
        state_code: 'CA',
        city: 'Los Angeles',
        zip: '90001'
      },
      items: [{
        variant_id: 4011,
        quantity: 1
      }]
    }
  })
});

const data = await response.json();
console.log(data.rates); // Array of shipping options
```

### 4. Create Order

**Endpoint:** `POST /api/printful-order` (with `action: "create"`)

**Usage:**
```javascript
const response = await fetch('/api/printful-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'create',
    order_data: {
      recipient: {
        name: 'John Doe',
        address1: '123 Main St',
        city: 'Los Angeles',
        state_code: 'CA',
        country_code: 'US',
        zip: '90001'
      },
      items: [{
        variant_id: 4011,
        quantity: 1,
        files: [{
          url: 'https://example.com/design.png'
        }]
      }]
    }
  })
});

const data = await response.json();
console.log(data.order); // Order details
```

### 5. Get Order Status

**Endpoint:** `GET /api/printful-order?order_id=123`

**Usage:**
```javascript
const response = await fetch('/api/printful-order?order_id=123');
const data = await response.json();
console.log(data.order); // Order status and details
```

## Quick Start Example

Here's a complete example to fetch and display products:

```javascript
// Fetch products when page loads
async function loadProducts() {
  try {
    const response = await fetch('/api/printful-products');
    const data = await response.json();
    
    if (data.success) {
      const products = data.products;
      
      // Display products
      products.forEach(product => {
        console.log(product.name, product.type);
        // Render to your page...
      });
    }
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

loadProducts();
```

## Testing

1. Open `http://localhost:3000/printful-demo.html` to test all endpoints
2. Check browser console for API responses
3. Make sure your `.env` file has `PRINTFUL_API_KEY` set

## Next Steps

1. Update `merch.html` to fetch products from Printful
2. Use mockup generator for product previews
3. Integrate order creation with Stripe checkout

