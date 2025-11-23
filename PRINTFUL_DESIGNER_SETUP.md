# Printful Embedded Design Maker Setup

## ⚠️ Important: Access Required

Printful's Embedded Design Maker (EDM) requires **special access**. You must:

1. **Request Access**: Contact Printful to request access to the Embedded Design Maker
   - Visit: https://developers.printful.com/docs/edm/
   - Fill out the enterprise form to request access

2. **OAuth Token Setup**: Once approved, you'll need to:
   - Log into Printful Developers Portal
   - Create an OAuth token with "Embedded Design Maker" extension enabled
   - Add your domain to the allowed domains list

## Implementation

### Backend - Nonce Token Generation

**Endpoint:** `POST /api/printful-designer-nonce`

**Request:**
```json
{
  "external_product_id": "product_71_variant_4011",
  "external_customer_id": "customer_123" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "nonce": "nonce_token_here",
  "expires_at": "2025-01-01T00:00:00Z"
}
```

### Frontend - Embedded Designer

**Page:** `designer.html` or `http://localhost:3000/designer`

**Features:**
- Product selection dropdown (loads from Printful catalog)
- Variant selection (sizes, colors, etc.)
- Embedded Printful designer interface
- Design ready callback handling
- Add to cart integration

## How It Works

1. **User selects product** → Frontend loads products from Printful
2. **User selects variant** → Frontend loads variants for that product
3. **User clicks "Start Designing"** → Backend generates nonce token
4. **Designer loads** → Printful EDM SDK initializes with nonce
5. **User designs** → All design work happens in Printful's embedded tool
6. **Design ready** → Callback fires, design data available
7. **Add to cart** → Design data saved, ready for checkout

## Testing

1. Make sure you have Printful EDM access
2. Set `PRINTFUL_API_KEY` in your `.env` file
3. Visit `http://localhost:3000/designer`
4. Select a product and variant
5. Click "Start Designing"

## Troubleshooting

**"Printful Designer SDK not loaded"**
- Check that you have EDM access
- Verify the SDK script is loading: `<script src="https://cdn.printful.com/edm/v1/edm.js"></script>`
- Check browser console for errors

**"Failed to generate nonce"**
- Verify `PRINTFUL_API_KEY` is set correctly
- Check that your API key has EDM permissions
- Verify your domain is whitelisted in Printful

**Designer doesn't initialize**
- Check browser console for errors
- Verify variant ID is valid
- Ensure nonce token is valid and not expired

## Integration with Cart

The designer saves design data to localStorage when "Add to Cart" is clicked. You'll need to:

1. Update your checkout flow to include design data
2. Pass design information to Printful when creating orders
3. Include design files in the order payload

See `designer.html` for the current cart integration implementation.

