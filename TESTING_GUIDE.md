# Testing Printful API Integration

## Quick Start

1. **Start the local server:**
   ```bash
   npm start
   ```

2. **Open your browser:**
   - Main site: http://localhost:3000
   - Designer page: http://localhost:3000/designer
   - API Demo page: http://localhost:3000/printful-demo

## Testing Endpoints

### 1. Test Products (V1 - Catalog)

**Get all products:**
```bash
curl http://localhost:3000/api/printful-products
```

**Get specific product:**
```bash
curl "http://localhost:3000/api/printful-products?product_id=456"
```

**Expected response:**
```json
{
  "success": true,
  "products": [...]
}
```

### 2. Test Product Designer Page

1. Navigate to: http://localhost:3000/designer
2. Select a product from the dropdown
3. Click "Start Designing"
4. **Note:** You'll see an access error if EDM access isn't configured (this is expected)

### 3. Test Mockups (V2)

**Create mockup task:**
```bash
curl -X POST http://localhost:3000/api/printful-mockup \
  -H "Content-Type: application/json" \
  -d '{
    "variant_ids": [4011],
    "format": "jpg",
    "width": 1000,
    "files": ["https://www.printful.com/static/images/layout/printful-logo.png"]
  }'
```

**Get mockup task status:**
```bash
curl "http://localhost:3000/api/printful-mockup?task_key=YOUR_TASK_KEY"
```

### 4. Test Orders (V2)

**Create order:**
```bash
curl -X POST http://localhost:3000/api/printful-order \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "order_data": {
      "recipient": {
        "name": "John Doe",
        "address1": "123 Main St",
        "city": "New York",
        "state_code": "NY",
        "country_code": "US",
        "zip": "10001"
      },
      "items": [{
        "variant_id": 4011,
        "quantity": 1
      }]
    }
  }'
```

**Get order status:**
```bash
curl "http://localhost:3000/api/printful-order?order_id=YOUR_ORDER_ID"
```

### 5. Test Shipping Rates (V2)

```bash
curl -X POST http://localhost:3000/api/printful-order \
  -H "Content-Type: application/json" \
  -d '{
    "action": "estimate_shipping",
    "shipping_data": {
      "recipient": {
        "country_code": "US",
        "state_code": "NY",
        "zip": "10001"
      },
      "items": [{
        "variant_id": 4011,
        "quantity": 1
      }]
    }
  }'
```

## Browser Testing

### Using the Demo Page

1. Navigate to: http://localhost:3000/printful-demo
2. Click "Fetch Products" to test the products endpoint
3. Use the mockup and order forms to test those endpoints
4. Check the browser console for any errors

### Using the Designer Page

1. Navigate to: http://localhost:3000/designer
2. Open browser DevTools (F12)
3. Go to the Console tab
4. Select a product and variant
5. Click "Start Designing"
6. Check console for:
   - Product loading logs
   - API request/response logs
   - Any error messages

## Testing Checklist

### ✅ Products API (V1)
- [ ] Can fetch list of products
- [ ] Can fetch specific product by ID
- [ ] Products display correctly in dropdown
- [ ] Product details include: id, display_name, price, image_url

### ✅ Product Variants (V1)
- [ ] Can fetch product variants
- [ ] Variant information is correct
- [ ] Default variant option is created when variants aren't available

### ✅ Designer Page
- [ ] Products load in dropdown
- [ ] Product selection works
- [ ] Variant selection works (or default variant is shown)
- [ ] Error message displays correctly if EDM access isn't available

### ⚠️ Mockups API (V2)
- [ ] Can create mockup task
- [ ] Can check mockup task status
- [ ] Mockup images are generated correctly

### ⚠️ Orders API (V2)
- [ ] Can create order
- [ ] Can retrieve order status
- [ ] Order data structure is correct

### ⚠️ Shipping API (V2)
- [ ] Can estimate shipping rates
- [ ] Shipping rates are returned correctly

## Common Issues

### "Failed to fetch products"
- Check that `PRINTFUL_OAUTH_TOKEN` is set in `.env`
- Verify the token is valid
- Check server logs for detailed error

### "Embedded Design Maker access required"
- This is expected if you don't have EDM access
- Request access at: https://developers.printful.com/docs/edm/
- Or use the standard Printful catalog without the designer

### "404 Not Found" on v2 endpoints
- Some v2 endpoints may not be fully available
- Catalog endpoints are still on v1 (this is expected)
- Check Printful API documentation for endpoint availability

### Products show as "undefined"
- Check browser console for errors
- Verify API response structure matches expected format
- Ensure server is running and endpoints are accessible

## Debugging

### Check Server Logs
The server logs all API requests and errors. Watch the terminal where `npm start` is running.

### Browser DevTools
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "api/printful"
4. Check request/response details
5. Look for error status codes (4xx, 5xx)

### Test API Directly
You can test Printful API directly with curl:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.printful.com/catalog/products?limit=5
```

## Next Steps

Once basic testing passes:
1. Test with real product IDs from your Printful catalog
2. Test order creation with actual designs
3. Test shipping estimation for different locations
4. Test mockup generation with your designs
5. Integrate with your checkout flow

