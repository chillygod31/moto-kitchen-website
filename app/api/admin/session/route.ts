import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated, getAdminUser } from '@/lib/auth/server-admin'

/**
 * GET /api/admin/session
 * Check admin session status
 * Returns tenant context if authenticated (Supabase Auth + JWT)
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

    const adminUser = await getAdminUser(request)
    
    if (!adminUser) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    // Get tenant slug from tenant_members
    const { createServerAdminClient } = await import('@/lib/supabase/server-admin')
    const supabase = createServerAdminClient()
    const { data: tenant } = await supabase
      .from('tenants')
      .select('slug')
      .eq('id', adminUser.membership.tenant_id)
      .single()

    return NextResponse.json({
      authenticated: true,
      tenantSlug: tenant?.slug || 'moto-kitchen',
      role: adminUser.membership.role,
      user: {
        id: adminUser.user.id,
        email: adminUser.user.email,
      },
    })
  } catch (error: any) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { authenticated: false, error: error.message },
      { status: 500 }
    )
  }
}

