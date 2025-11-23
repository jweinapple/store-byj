# Printful API v2 Migration

This project has been partially migrated to use Printful API v2 (beta) where available. See the [official migration guide](https://developers.printful.com/docs/v2-beta/#section/Migration-Guide) for details.

## Migration Status

### ✅ Migrated to V2
- **Orders**: `/v2/orders`
- **Mockups**: `/v2/mockup-generator/tasks`
- **Shipping**: `/v2/shipping-rates`

### ⚠️ Still Using V1 (v2 not available)
- **Catalog**: `/catalog/products` (v2 endpoints return 404)
  - Catalog v2 endpoints are not yet available in the beta
  - Will migrate when Printful releases catalog v2

## Changes Made

### Base URL
- **V1 Catalog:** `https://api.printful.com/catalog/products`
- **V2 Orders/Mockups/Shipping:** `https://api.printful.com/v2/orders`

### Response Structure
- **V1:** `{ result: {...}, extra: [] }`
- **V2:** `{ data: {...}, extra: [] }`

All response parsing has been updated to use `data` instead of `result`.

### Updated Endpoints

#### Catalog
- `GET /catalog/products` → `GET /v2/catalog/products`
- `GET /catalog/products/{id}` → `GET /v2/catalog/products/{id}`
- `GET /catalog/products/{id}/variants` → `GET /v2/catalog/products/{id}/variants` (new in v2)

#### Orders
- `POST /orders` → `POST /v2/orders`
- `GET /orders/@{id}` → `GET /v2/orders/{id}` (no @ prefix in v2)

#### Mockups
- `POST /mockup-generator/create-task` → `POST /v2/mockup-generator/tasks`
- `GET /mockup-generator/task?task_key={key}` → `GET /v2/mockup-generator/tasks/{task_key}`

#### Shipping
- `POST /shipping/rates` → `POST /v2/shipping-rates`

### Key V2 Features

1. **Itemized Order Building**: More flexibility in order creation
2. **Multiple Design Layers**: Support for multiple design layers per placement
3. **Standardized Formats**: 
   - Time: ISO 8601, UTC timezone
   - Prices: String format with up to 2 decimal points
4. **Uniform Pagination**: Consistent pagination parameters across all endpoints
5. **Rate Limiting**: Leaky bucket algorithm with `X-Ratelimit-*` headers

### Authentication

No changes required - both V1 and V2 use the same OAuth token authentication.

### Testing

All endpoints have been updated to use V2. Test thoroughly before deploying to production.

## References

- [Printful API v2 Documentation](https://developers.printful.com/docs/v2-beta/)
- [Migration Guide](https://developers.printful.com/docs/v2-beta/#section/Migration-Guide)
- [Postman Collection](https://developers.printful.com/docs/v2-beta/#section/Postman-Collection)

