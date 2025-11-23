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

        // Get ALL discography (albums, singles, compilations, etc.)
        const albumsResponse = await fetch(`https://api.spotify.com/v1/artists/${SPOTIFY_CONFIG.ARTIST_ID}/albums?include_groups=album,single,compilation,appears_on&limit=50&market=US`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const albumsData = await albumsResponse.json();
        
        // If there are more items, get them all
        let allAlbums = albumsData.items || [];
        let nextUrl = albumsData.next;
        
        while (nextUrl) {
            const nextResponse = await fetch(nextUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            const nextData = await nextResponse.json();
            allAlbums = allAlbums.concat(nextData.items || []);
            nextUrl = nextData.next;
        }
        
        // Return all albums
        res.status(200).json({
            ...albumsData,
            items: allAlbums
        });
    } catch (error) {
        console.error('Error fetching discography:', error);
        res.status(500).json({ error: 'Failed to fetch discography' });
    }
}
