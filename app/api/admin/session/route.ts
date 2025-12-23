import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated, getAdminSession } from '@/lib/admin-auth'

/**
 * GET /api/admin/session
 * Check admin session status
 * Returns tenant context if authenticated
 */
export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated(request)
    
    if (!authenticated) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    const session = await getAdminSession(request)
    
    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      tenantSlug: session.tenantSlug,
    })
  } catch (error: any) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { authenticated: false, error: error.message },
      { status: 500 }
    )
  }
}

