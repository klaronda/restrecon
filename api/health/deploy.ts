/**
 * DoneWell Health Adapter - Deploy Webhook Endpoint
 * POST /api/health/deploy
 * 
 * Receives deploy notifications from Vercel webhooks
 * Can be used to suppress alerts during deployment windows
 */

// CORS headers for cross-origin monitoring
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

interface DeployPayload {
  type: 'deployment.created' | 'deployment.succeeded' | 'deployment.failed' | 'deployment.ready'
  payload?: {
    deployment?: {
      id?: string
      url?: string
      name?: string
    }
  }
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

  try {
    const body: DeployPayload = req.body

    // Log the deploy event
    console.log('[DoneWell Deploy Event]', JSON.stringify({
      site_id: process.env.SITE_ID || 'nest_prod_001',
      site_name: process.env.SITE_NAME || 'nestrecon.com',
      environment: process.env.ENVIRONMENT || 'production',
      event_type: body.type,
      deployment_id: body.payload?.deployment?.id,
      deployment_url: body.payload?.deployment?.url,
      received_at: new Date().toISOString()
    }))

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    return res.status(200).json({
      status: 'received',
      event_type: body.type,
      received_at: new Date().toISOString()
    })
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error'
    })
  }
}

