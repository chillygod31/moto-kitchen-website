import { NextRequest, NextResponse } from 'next/server'
import { createServerAdminClient } from '@/lib/supabase/server-admin'

/**
 * GET /api/health
 * Health check endpoint for monitoring/uptime services
 */
export async function GET(request: NextRequest) {
  try {
    // Basic health check - verify database connection
    const supabase = createServerAdminClient()
    const { error } = await supabase
      .from('tenants')
      .select('id')
      .limit(1)

    if (error) {
      return NextResponse.json(
        { 
          status: 'unhealthy', 
          error: 'Database connection failed',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'moto-kitchen-api',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}

