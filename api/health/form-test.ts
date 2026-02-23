/**
 * DoneWell Health Adapter - Form Test Endpoint
 * POST /api/health/form-test
 * 
 * Validates a test form submission without persisting data
 * For NestRecon: validates preference profile structure
 */

// CORS headers for cross-origin monitoring
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

interface TestFormPayload {
  name: string
  email: string
  message: string
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
    const body: TestFormPayload = req.body

    // Validate required fields
    const errors: string[] = []
    
    if (!body.name || body.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters')
    }
    
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      errors.push('Invalid email format')
    }
    
    if (!body.message || body.message.trim().length < 10) {
      errors.push('Message must be at least 10 characters')
    }

    if (errors.length > 0) {
      return res.status(400).json({
        status: 'validation_failed',
        errors,
        validated_at: new Date().toISOString()
      })
    }

    // Validation passed - don't actually submit
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    return res.status(200).json({
      status: 'validation_passed',
      message: 'Test submission would succeed',
      validated_at: new Date().toISOString()
    })
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error'
    })
  }
}



