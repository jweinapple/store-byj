export default async function handler(req, res) {
    // Enable CORS - restrict to your domain
    const allowedOrigins = [
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
        'https://store-k1s1xz7s2-byjs-projects-c6a90398.vercel.app',
        'http://localhost:3000'
    ].filter(Boolean);
    
    const origin = req.headers.origin;
    // Use exact match instead of includes() for better security
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // For local development, detect test vs live mode from secret key
        // and use the matching publishable key
        const secretKey = process.env.STRIPE_SECRET_KEY;
        const publishableKeyTest = process.env.STRIPE_PUBLISHABLE_KEY_TEST;
        const publishableKeyLive = process.env.STRIPE_PUBLISHABLE_KEY;
        
        // Debug logging to help diagnose environment variable issues
        console.log('🔍 Environment variable check:');
        console.log(`   STRIPE_SECRET_KEY: ${secretKey ? (secretKey.substring(0, 20) + '...') : 'NOT SET'}`);
        console.log(`   STRIPE_PUBLISHABLE_KEY: ${publishableKeyLive ? (publishableKeyLive.substring(0, 20) + '...') : 'NOT SET'}`);
        console.log(`   STRIPE_PUBLISHABLE_KEY_TEST: ${publishableKeyTest ? (publishableKeyTest.substring(0, 20) + '...') : 'NOT SET'}`);
        console.log(`   Running on: ${process.env.VERCEL ? 'Vercel' : 'Local'}`);
        
        let publishableKey = null;
        let secretKeyMode = 'unknown';
        
        // Detect secret key mode
        if (secretKey) {
            if (secretKey.startsWith('sk_test_')) {
                secretKeyMode = 'test';
            } else if (secretKey.startsWith('sk_live_')) {
                secretKeyMode = 'live';
            }
        }
        
        // Select the matching publishable key
        if (secretKeyMode === 'test') {
            // For test mode, we MUST use a test publishable key
            if (publishableKeyTest) {
                // Validate that the test key is actually a test key
                if (!publishableKeyTest.startsWith('pk_test_')) {
                    console.error('❌ STRIPE_PUBLISHABLE_KEY_TEST is not a test key!');
                    return res.status(500).json({ 
                        error: 'Configuration error: Invalid test key',
                        message: 'STRIPE_PUBLISHABLE_KEY_TEST must start with pk_test_. Please check your environment variables.'
                    });
                }
                publishableKey = publishableKeyTest;
                console.log('✅ Using STRIPE_PUBLISHABLE_KEY_TEST for test mode');
            } else if (publishableKeyLive && publishableKeyLive.startsWith('pk_test_')) {
                publishableKey = publishableKeyLive;
                console.log('✅ Using STRIPE_PUBLISHABLE_KEY (test mode detected)');
            } else {
                // CRITICAL: Don't use a live key with a test secret key!
                console.error('❌ KEY MODE MISMATCH: Test secret key but no test publishable key found!');
                console.error(`   Secret key: ${secretKeyMode} mode (${secretKey?.substring(0, 20)}...)`);
                console.error(`   STRIPE_PUBLISHABLE_KEY: ${publishableKeyLive ? (publishableKeyLive.substring(0, 20) + '...') : 'not set'}`);
                console.error(`   STRIPE_PUBLISHABLE_KEY_TEST: ${publishableKeyTest ? (publishableKeyTest.substring(0, 20) + '...') : 'not set'}`);
                return res.status(500).json({ 
                    error: 'Configuration error: Key mode mismatch',
                    message: 'Your STRIPE_SECRET_KEY is in test mode, but no test publishable key is configured. Set STRIPE_PUBLISHABLE_KEY_TEST=pk_test_... in your environment variables.'
                });
            }
        } else if (secretKeyMode === 'live') {
            // For live mode, we MUST use a live publishable key
            if (publishableKeyLive && publishableKeyLive.startsWith('pk_live_')) {
                publishableKey = publishableKeyLive;
                console.log('✅ Using STRIPE_PUBLISHABLE_KEY (live mode)');
            } else {
                // CRITICAL: Don't use a test key with a live secret key!
                console.error('❌ KEY MODE MISMATCH: Live secret key but no live publishable key found!');
                console.error(`   Secret key: ${secretKeyMode} mode (${secretKey?.substring(0, 20)}...)`);
                console.error(`   STRIPE_PUBLISHABLE_KEY: ${publishableKeyLive ? (publishableKeyLive.substring(0, 20) + '...') : 'not set'}`);
                return res.status(500).json({ 
                    error: 'Configuration error: Key mode mismatch',
                    message: 'Your STRIPE_SECRET_KEY is in live mode, but STRIPE_PUBLISHABLE_KEY is not a live key. Set STRIPE_PUBLISHABLE_KEY=pk_live_... in your environment variables.'
                });
            }
        } else {
            // Unknown mode - try to detect from available keys
            if (publishableKeyTest) {
                publishableKey = publishableKeyTest;
                console.warn('⚠️  Could not detect secret key mode, using STRIPE_PUBLISHABLE_KEY_TEST');
            } else if (publishableKeyLive) {
                publishableKey = publishableKeyLive;
                console.warn('⚠️  Could not detect secret key mode, using STRIPE_PUBLISHABLE_KEY');
            }
        }
        
        if (!publishableKey) {
            console.error('❌ No Stripe publishable key found');
            return res.status(500).json({ 
                error: 'Server configuration error',
                message: 'Stripe publishable key not configured. Set STRIPE_PUBLISHABLE_KEY or STRIPE_PUBLISHABLE_KEY_TEST in environment variables'
            });
        }
        
        // Final verification: ensure key modes match
        const publishableKeyMode = publishableKey.startsWith('pk_test_') ? 'test' : (publishableKey.startsWith('pk_live_') ? 'live' : 'unknown');
        
        if (secretKeyMode !== 'unknown' && publishableKeyMode !== 'unknown' && secretKeyMode !== publishableKeyMode) {
            // This should never happen now due to the checks above, but just in case...
            console.error(`❌ CRITICAL: Key mode mismatch detected after selection!`);
            console.error(`   Secret key: ${secretKeyMode} mode (${secretKey?.substring(0, 20)}...)`);
            console.error(`   Publishable key: ${publishableKeyMode} mode (${publishableKey.substring(0, 20)}...)`);
            return res.status(500).json({ 
                error: 'Configuration error: Key mode mismatch',
                message: `Secret key is ${secretKeyMode} mode but publishable key is ${publishableKeyMode} mode. They must match.`
            });
        } else if (secretKeyMode === publishableKeyMode) {
            console.log(`✅ Key modes match: ${secretKeyMode} mode`);
        }
        
        res.status(200).json({ publishableKey });
    } catch (error) {
        console.error('Error getting publishable key:', error);
        res.status(500).json({ error: 'Failed to get publishable key' });
    }
}

