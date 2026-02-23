import { createClient } from '@supabase/supabase-js'

/**
 * DoneWell Health Adapter - Core Health Endpoint
 * GET /api/health
 * 
 * Required environment variables:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 * - SITE_ID
 * - SITE_NAME
 * - ENVIRONMENT
 */

// CORS headers for cross-origin monitoring
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

interface HealthResponse {
  site_id: string
  site: string
  environment: string
  status: 'ok' | 'degraded' | 'error'
  timestamp: string
  version: string
  checks: {
    frontend: 'ok' | 'error'
    cms: 'ok' | 'error'
    forms: 'ok' | 'error'
  }
}

export default async function handler(req: any, res: any) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value))
    return res.status(204).end()
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value))

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
  const siteId = process.env.SITE_ID || 'nest_prod_001'
  const siteName = process.env.SITE_NAME || 'nestrecon.com'
  const environment = process.env.ENVIRONMENT || 'production'
  const version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev'

  const checks = {
    frontend: 'ok' as const,
    cms: 'ok' as 'ok' | 'error',
    forms: 'ok' as 'ok' | 'error'
  }

  // Database check - fetch 1 user with 2000ms timeout (checks DB connectivity)
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)

      const { error: cmsError } = await supabase
        .from('users')
        .select('id')
        .limit(1)
        .abortSignal(controller.signal)

      clearTimeout(timeoutId)

      if (cmsError && cmsError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is ok
        checks.cms = 'error'
      }
    } catch (err) {
      checks.cms = 'error'
    }

    // Secondary DB check - verify preference_profiles table is accessible
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)

      const { error: formsError } = await supabase
        .from('preference_profiles')
        .select('id')
        .limit(1)
        .abortSignal(controller.signal)

      clearTimeout(timeoutId)

      if (formsError && formsError.code !== 'PGRST116') {
        checks.forms = 'error'
      }
    } catch (err) {
      checks.forms = 'error'
    }
  } else {
    checks.cms = 'error'
    checks.forms = 'error'
  }

  // Determine overall status
  const allOk = checks.frontend === 'ok' && checks.cms === 'ok' && checks.forms === 'ok'
  const anyError = checks.cms === 'error' || checks.forms === 'error'
  const status = allOk ? 'ok' : anyError ? 'degraded' : 'ok'

  const response: HealthResponse = {
    site_id: siteId,
    site: siteName,
    environment,
    status,
    timestamp: new Date().toISOString(),
    version,
    checks
  }

  // Return 503 if any critical check fails
  const httpStatus = checks.frontend === 'error' ? 503 : 200

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  return res.status(httpStatus).json(response)
}



