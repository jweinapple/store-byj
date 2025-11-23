// Use native fetch (available in Node.js 18+ and Vercel runtime)
import { Buffer } from 'buffer';

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
        if (!tokenData.access_token) {
            throw new Error('Failed to get access token');
        }
        const accessToken = tokenData.access_token;

        // Get all albums, singles, and EPs
        const albumsResponse = await fetch(`https://api.spotify.com/v1/artists/${SPOTIFY_CONFIG.ARTIST_ID}/albums?include_groups=album,single,ep&limit=50&market=US`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const albumsData = await albumsResponse.json();
        const albums = albumsData.items || [];

        if (albums.length === 0) {
            return res.status(404).json({ error: 'No albums found' });
        }

        // Pick a random album
        const randomAlbum = albums[Math.floor(Math.random() * albums.length)];

        // Get tracks from the random album
        const tracksResponse = await fetch(`https://api.spotify.com/v1/albums/${randomAlbum.id}/tracks?limit=50&market=US`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const tracksData = await tracksResponse.json();
        const tracks = tracksData.items || [];

        if (tracks.length === 0) {
            return res.status(404).json({ error: 'No tracks found in album' });
        }

        // Pick a random track
        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];

        // Get full track details
        const trackDetailsResponse = await fetch(`https://api.spotify.com/v1/tracks/${randomTrack.id}?market=US`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const trackDetails = await trackDetailsResponse.json();

        // Return track with Spotify URI for embedding
        res.status(200).json({
            id: trackDetails.id,
            name: trackDetails.name,
            artists: trackDetails.artists.map(a => a.name).join(', '),
            album: trackDetails.album.name,
            albumImage: trackDetails.album.images[0]?.url || null,
            preview_url: trackDetails.preview_url,
            external_urls: trackDetails.external_urls,
            uri: trackDetails.uri,
            spotify_url: trackDetails.external_urls.spotify
        });
    } catch (error) {
        console.error('Error fetching random track:', error);
        res.status(500).json({ error: 'Failed to fetch random track', message: error.message });
    }
}



