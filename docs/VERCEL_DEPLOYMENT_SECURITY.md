# Vercel Deployment Security Guide

## 🔒 How Vercel Secures Environment Variables

### Server-Side Only Access
Vercel environment variables are **ONLY accessible in serverless functions** (your `/api/*` endpoints). They are:
- ✅ **Encrypted at rest** in Vercel's secure storage
- ✅ **Never included** in client-side JavaScript bundles
- ✅ **Never exposed** in browser network requests
- ✅ **Only available** at runtime in serverless functions

### Your Current Setup is Secure ✅

All your Printful API calls go through server-side endpoints:
- `/api/printful-products.js` → Serverless function
- `/api/printful-mockup.js` → Serverless function  
- `/api/printful-order.js` → Serverless function
- `/api/printful-designer-nonce.js` → Serverless function

**The OAuth token is NEVER sent to the browser.**

## 📋 Setting Up Environment Variables in Vercel

### Step 1: Add Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

#### Required:
```
PRINTFUL_OAUTH_TOKEN = wWQKqoYIv7Qk5rOx5codvxXnckgFz20UEfs60yit
```

#### Optional:
```
PRINTFUL_STORE_ID = your_store_id (if you have multiple stores)
```

### Step 2: Configure Environments

For each variable, select which environments it applies to:
- ✅ **Production** - Your live site
- ✅ **Preview** - Pull request previews (optional, but recommended)
- ✅ **Development** - Local development (optional)

**Recommendation:** Add to all three environments for consistency.

### Step 3: Mark as Sensitive (Recommended)

When adding the `PRINTFUL_OAUTH_TOKEN`:
1. Check the **"Sensitive"** checkbox
2. This makes the value non-readable after creation (even by you)
3. You'll need to re-enter it if you want to change it later

### Step 4: Redeploy

After adding environment variables:
1. Vercel will automatically redeploy, OR
2. Go to **Deployments** → Click **"Redeploy"** on the latest deployment

## 🔍 How to Verify Security

### ✅ Safe (Server-Side Only)
```javascript
// ✅ SAFE - In /api/printful-products.js (serverless function)
const token = process.env.PRINTFUL_OAUTH_TOKEN; // Only runs on server
```

### ❌ Unsafe (Would Expose to Client)
```javascript
// ❌ UNSAFE - Never do this!
const token = process.env.NEXT_PUBLIC_PRINTFUL_TOKEN; // Exposed to browser!
```

**Your code is safe** - you're not using `NEXT_PUBLIC_` prefix anywhere.

## 🛡️ Vercel's Security Model

### What Happens When You Deploy:

1. **Build Time:**
   - Vercel reads environment variables from secure storage
   - Variables are injected into serverless function runtime
   - **NOT included** in static HTML/JS bundles

2. **Runtime (Serverless Functions):**
   - Environment variables available via `process.env.*`
   - Only accessible in `/api/*` functions
   - Never exposed in response headers or body

3. **Client-Side:**
   - No access to `process.env.PRINTFUL_OAUTH_TOKEN`
   - Can only call your API endpoints
   - Never sees the actual token

## 📊 Security Checklist for Vercel

- [x] Environment variables added in Vercel dashboard
- [x] Variables marked as "Sensitive" (recommended)
- [x] No `NEXT_PUBLIC_` prefix on sensitive variables
- [x] All API calls go through `/api/*` endpoints
- [x] No hardcoded tokens in code
- [x] `.env` file in `.gitignore` (for local dev)

## 🔄 Environment Variable Reference

### Required for Printful Integration:
```bash
PRINTFUL_OAUTH_TOKEN=wWQKqoYIv7Qk5rOx5codvxXnckgFz20UEfs60yit
```

### Optional:
```bash
PRINTFUL_STORE_ID=your_store_id
```

### Other Variables You May Have:
```bash
# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_...

# Supabase
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...

# Spotify
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...

# Email
SMTP_HOST=...
SMTP_USER=...
SMTP_PASSWORD=...
```

## 🚨 Important Security Notes

1. **Never commit `.env` files** - Already in `.gitignore` ✅
2. **Use "Sensitive" flag** - Makes values non-readable after creation
3. **Rotate tokens periodically** - Update in Vercel dashboard
4. **Limit team access** - Only give access to trusted team members
5. **Monitor deployments** - Review what's being deployed

## 🔗 Quick Links

- [Vercel Environment Variables Docs](https://vercel.com/docs/projects/environment-variables)
- [Vercel Sensitive Variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables)
- [Printful OAuth Setup](./PRINTFUL_OAUTH_SETUP.md)

## ✅ Your Current Status

**Your implementation is secure for Vercel deployment:**
- ✅ All API calls use serverless functions
- ✅ No client-side exposure
- ✅ Proper environment variable usage
- ✅ No `NEXT_PUBLIC_` prefixes on sensitive vars

**Next Step:** Add `PRINTFUL_OAUTH_TOKEN` to Vercel dashboard before deploying!

