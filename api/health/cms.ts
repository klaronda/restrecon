import { createClient } from '@supabase/supabase-js'

/**
 * DoneWell Health Adapter - CMS/Database Health Endpoint
 * GET /api/health/cms
 * 
 * Performs a lightweight Supabase query to measure latency
 */

// CORS headers for cross-origin monitoring
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async function handler(req: any, res: any) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value))
    return res.status(204).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value))

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({
      status: 'error',
      provider: 'supabase',
      error: 'Missing Supabase credentials'
    })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    // Lightweight query - just check if users table is accessible
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal)

    clearTimeout(timeoutId)

    const latencyMs = Date.now() - startTime

    if (error && error.code !== 'PGRST116') {
      return res.status(503).json({
        status: 'error',
        provider: 'supabase',
        latency_ms: latencyMs,
        error: error.message
      })
    }

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    return res.status(200).json({
      status: 'ok',
      provider: 'supabase',
      latency_ms: latencyMs,
      last_publish_check: new Date().toISOString()
    })
  } catch (err) {
    const latencyMs = Date.now() - startTime
    return res.status(503).json({
      status: 'error',
      provider: 'supabase',
      latency_ms: latencyMs,
      error: err instanceof Error ? err.message : 'Unknown error'
    })
  }
}

