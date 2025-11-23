# Security Best Practices

## Printful API Credentials

### ✅ Secure Implementation

The Printful API integration is designed with security in mind:

1. **Server-Side Only**: OAuth tokens are stored in environment variables and only accessed in server-side code (Vercel Functions)
2. **No Client Exposure**: The OAuth token is NEVER sent to the browser or included in client-side JavaScript
3. **Proxy Pattern**: All Printful API calls go through your server-side endpoints (`/api/printful-*`), which act as a secure proxy
4. **OAuth 2.0 Bearer Tokens**: Using modern OAuth authentication (Printful deprecated Basic Auth in 2023)

### How It Works

```
Browser (Frontend)
    ↓
    Calls: /api/printful-products
    ↓
Vercel Function (Server-Side)
    ↓
    Reads: process.env.PRINTFUL_OAUTH_TOKEN (server-side only)
    ↓
    Makes authenticated request to Printful API with Bearer token
    ↓
    Returns data to browser (without exposing credentials)
```

### Environment Variables

**Current Variables:**
- `PRINTFUL_OAUTH_TOKEN` - OAuth 2.0 Bearer token (required)
- `PRINTFUL_STORE_ID` - Optional store ID for multi-store accounts

**Local Development:**
- Store in `.env` file (already in `.gitignore`)
- Never commit `.env` to git
- ✅ `.env` is listed in `.gitignore` - verified secure

**Vercel Production:**
- Store in Vercel Dashboard → Settings → Environment Variables
- Automatically encrypted and secure
- Only accessible in server-side functions (serverless functions)
- Never exposed in client bundles or network requests
- **Mark as "Sensitive"** for extra security (makes values non-readable after creation)
- See `VERCEL_DEPLOYMENT_SECURITY.md` for detailed setup instructions

### What's Safe vs. Unsafe

✅ **SAFE:**
- Storing OAuth tokens in Vercel environment variables
- Accessing `process.env.PRINTFUL_OAUTH_TOKEN` in server-side code only
- Making API calls from Vercel Functions (server-side)
- Using Bearer token authentication in server-side requests

❌ **UNSAFE:**
- Putting OAuth tokens in HTML files
- Including OAuth tokens in client-side JavaScript
- Committing `.env` files to git
- Exposing OAuth tokens in browser console or network requests
- Logging tokens in console.log (server-side logs are OK, but avoid logging the actual token)

### Current Security Status

Your implementation is **secure**:
- ✅ All API calls go through server-side endpoints (`/api/printful-*`)
- ✅ OAuth token only accessed via `process.env.PRINTFUL_OAUTH_TOKEN` (server-side)
- ✅ No credentials in HTML or client-side JavaScript files
- ✅ Proper separation of client and server code
- ✅ `.env` file is in `.gitignore` (verified)
- ✅ Using OAuth 2.0 Bearer tokens (modern, secure authentication)
- ✅ All Printful API requests use server-side proxy pattern

### Security Checklist

- [x] `.env` in `.gitignore`
- [x] No `PRINTFUL_OAUTH_TOKEN` in HTML files
- [x] No `PRINTFUL_OAUTH_TOKEN` in client-side JavaScript
- [x] All API calls proxied through server endpoints
- [x] Token only accessed via `process.env` in server code
- [x] Using OAuth 2.0 (not deprecated Basic Auth)

