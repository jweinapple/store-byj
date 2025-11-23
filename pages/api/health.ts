import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.HEALTH_CHECK_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Test database connection by querying the orders table
    const { error } = await supabase.from('orders').select('id').limit(1)
    if (error) throw error

    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
}
