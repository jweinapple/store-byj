import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Enable CORS
  const allowedOrigins = [
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    'https://byj.vercel.app',
    'https://store-k1s1xz7s2-byjs-projects-c6a90398.vercel.app',
    'http://localhost:3000'
  ].filter(Boolean);
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authorization
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.HEALTH_CHECK_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Support multiple environment variable naming conventions
    const supabaseUrl = process.env.SUPABASE_URL || 
                       process.env.SUPABASE_PROJECT_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                       process.env.SUPABASE_SERVICE_ROLE;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        error: 'Database not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.' 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.from('products').select('id').limit(1);
    if (error) throw error;

    return res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}

