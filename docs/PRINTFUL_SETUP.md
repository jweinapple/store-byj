# Printful Integration Setup

## 🔒 Security Note

**Your Printful API credentials are NEVER exposed to the frontend/client-side code.** They are only used in server-side API endpoints (Vercel Functions), which run securely on the server. This is the correct and secure implementation.

## Environment Variables

### Local Development (.env file)

Create a `.env` file in the project root (DO NOT commit this file to git):

```bash
PRINTFUL_API_KEY=your_printful_api_key_here
PRINTFUL_STORE_ID=your_store_id  # Optional
```

### Vercel Production

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - `PRINTFUL_API_KEY` = Your Printful API key
   - `PRINTFUL_STORE_ID` = Your store ID (optional)

**Important**: 
- ✅ Environment variables in Vercel are server-side only
- ✅ They are NOT accessible from client-side JavaScript
- ✅ They are encrypted at rest
- ❌ Never put API keys in HTML, JavaScript, or any client-side code
- ❌ Never commit `.env` files to git (add to `.gitignore`)

## API Endpoints Created

### 1. `/api/printful-products`
- **GET** - Fetch products from Printful catalog
  - Query params: `product_id` (optional), `category_id` (optional)
  - Returns: List of products or single product with variants

### 2. `/api/printful-mockup`
- **POST** - Create mockup task
  - Body: `{ variant_ids, files, format, width }`
  - Returns: `task_key` for polling
- **GET** - Get mockup task status
  - Query params: `task_key`
  - Returns: Mockup images when ready

### 3. `/api/printful-order`
- **POST** - Create order or estimate shipping
  - Body: `{ action: "create" | "estimate_shipping", order_data | shipping_data }`
  - Returns: Order details or shipping rates
- **GET** - Get order status
  - Query params: `order_id`
  - Returns: Order status

## Next Steps

1. Set environment variables in Vercel
2. Update `merch.html` to fetch products from Printful
3. Integrate mockup generator for product previews
4. Connect Stripe checkout to Printful order creation

## Printful API Documentation
- https://developers.printful.com/

