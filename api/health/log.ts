/**
 * DoneWell Health Adapter - Error Log Endpoint
 * POST /api/health/log
 * 
 * Accepts error payloads from client-side error handlers
 * Requires X-DoneWell-Secret header for authentication
 */

// CORS headers for cross-origin monitoring
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-DoneWell-Secret',
}

interface ErrorLogPayload {
  level: 'error' | 'warn' | 'info'
  message: string
  stack?: string
  context?: Record<string, any>
  timestamp?: string
}

export default async function handler(req: any, res: any) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value))
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value))

  // Verify secret
  const secret = req.headers['x-donewell-secret']
  const expectedSecret = process.env.DONEWELL_LOG_SECRET

  if (!expectedSecret || secret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const body: ErrorLogPayload = req.body

    // Validate payload
    if (!body.level || !body.message) {
      return res.status(400).json({ error: 'Missing required fields: level, message' })
    }

    // Log the error (in production, this would forward to DoneWell's ingest-error function)
    console.error('[DoneWell Error Log]', JSON.stringify({
      site_id: process.env.SITE_ID || 'nest_prod_001',
      site_name: process.env.SITE_NAME || 'nestrecon.com',
      environment: process.env.ENVIRONMENT || 'production',
      ...body,
      received_at: new Date().toISOString()
    }))

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    return res.status(200).json({
      status: 'logged',
      received_at: new Date().toISOString()
    })
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error'
    })
  }
}



