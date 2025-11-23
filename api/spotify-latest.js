// Using native fetch (available in Node.js 18+)

// Spotify API Configuration (using environment variables)
const SPOTIFY_CONFIG = {
    CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
    CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
    ARTIST_ID: process.env.SPOTIFY_ARTIST_ID || '0tA6AExzlXn8NLMfKNxdws'
};

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Get access token
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CONFIG.CLIENT_ID + ':' + SPOTIFY_CONFIG.CLIENT_SECRET).toString('base64')
            },
            body: 'grant_type=client_credentials'
        });

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Get latest release
        const albumsResponse = await fetch(`https://api.spotify.com/v1/artists/${SPOTIFY_CONFIG.ARTIST_ID}/albums?include_groups=album,single&limit=1`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const albumsData = await albumsResponse.json();
        const latestRelease = albumsData.items[0];

        res.status(200).json(latestRelease);
    } catch (error) {
        console.error('Error fetching latest release:', error);
        res.status(500).json({ error: 'Failed to fetch latest release' });
    }
}
