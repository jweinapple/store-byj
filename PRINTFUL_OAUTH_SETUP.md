# Printful OAuth Token Setup

Printful has deprecated Basic Auth and now requires OAuth 2.0 Bearer tokens for API authentication.

## Steps to Get Your OAuth Token

1. **Go to Printful Developers Portal**
   - Visit: https://developers.printful.com/
   - Log in with your Printful account

2. **Create a New Token**
   - Navigate to the "Tokens" section
   - Click "Add new token"
   - Name your token (e.g., "Store API Token")
   - Select the scopes/permissions you need:
     - `catalog` - For fetching products
     - `orders` - For creating orders
     - `embedded-designer` - For the Embedded Design Maker
   - Click "Create token"

3. **Copy Your Token**
   - Copy the generated OAuth token (it will look like a long string)
   - **Important:** This token is only shown once! Save it securely.

4. **Add to Environment Variables**

   **For Local Development (.env file):**
   ```
   PRINTFUL_OAUTH_TOKEN=your_oauth_token_here
   ```

   **For Vercel Production:**
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add `PRINTFUL_OAUTH_TOKEN` with your token value
   - Deploy to apply changes

5. **Restart Your Server**
   - After adding the token, restart your local server:
     ```bash
     npm start
     ```

## Migration from Basic Auth

If you were using Basic Auth (API keys), you need to:
1. Create a new OAuth token as described above
2. Replace `PRINTFUL_API_KEY` with `PRINTFUL_OAUTH_TOKEN` in your environment variables
3. The code will automatically use Bearer authentication

## Security Notes

- Never commit your OAuth token to version control
- Keep your token secure and rotate it if compromised
- Use different tokens for development and production environments

## Troubleshooting

- **401 Unauthorized:** Make sure your OAuth token is correct and hasn't expired
- **403 Forbidden:** Check that your token has the required scopes/permissions
- **Token not found:** Verify the environment variable name is `PRINTFUL_OAUTH_TOKEN`

For more information, see Printful's migration guide:
https://help.printful.com/hc/en-us/articles/4632388335260-What-should-I-know-about-API-key-to-API-token-migration-

