// Using native fetch (available in Node.js 18+)

// Spotify API Configuration (using environment variables)
const SPOTIFY_CONFIG = {
    CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
    CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
    ARTIST_ID: process.env.SPOTIFY_ARTIST_ID || '0tA6AExzlXn8NLMfKNxdws'
};

// Simple in-memory cache (resets on server restart)
let cache = {
    data: null,
    timestamp: null,
    expiresIn: 3600000 // 1 hour in milliseconds
};

async function getAccessToken() {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CONFIG.CLIENT_ID + ':' + SPOTIFY_CONFIG.CLIENT_SECRET).toString('base64')
        },
        body: 'grant_type=client_credentials'
    });

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
}

async function fetchDiscography(accessToken, limit = 6) {
    // Get discography with limit (default 6 for faster initial load)
    const albumsResponse = await fetch(`https://api.spotify.com/v1/artists/${SPOTIFY_CONFIG.ARTIST_ID}/albums?include_groups=album,single&limit=${limit}&market=US`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    const albumsData = await albumsResponse.json();
    
    return albumsData;
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Check cache first
        const now = Date.now();
        if (cache.data && cache.timestamp && (now - cache.timestamp) < cache.expiresIn) {
            console.log('✅ Returning cached discography data');
            return res.status(200).json(cache.data);
        }

        // Get access token
        const accessToken = await getAccessToken();
        
        if (!accessToken) {
            throw new Error('Failed to get access token');
        }

        // Get limit from query parameter (default 6 for faster loading)
        const limit = parseInt(req.query?.limit) || 6;

        // Fetch discography with limit
        const albumsData = await fetchDiscography(accessToken, limit);
        
        // Update cache
        cache.data = albumsData;
        cache.timestamp = now;
        
        // Return albums
        res.status(200).json(albumsData);
    } catch (error) {
        console.error('Error fetching discography:', error);
        
        // Return cached data if available, even if expired
        if (cache.data) {
            console.log('⚠️ Returning stale cache due to error');
            return res.status(200).json(cache.data);
        }
        
        res.status(500).json({ error: 'Failed to fetch discography' });
    }
}
