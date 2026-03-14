import { NextRequest, NextResponse } from 'next/server'
import { getAdminTenantId } from '@/lib/auth/server-admin'
import { getAuthUrl } from '@/lib/google-calendar'

/**
 * GET /api/admin/calendar/oauth
 * Redirects to Google OAuth consent screen
 */
export async function GET(request: NextRequest) {
  try {
    await getAdminTenantId(request)
    const authUrl = getAuthUrl()
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { message: 'Failed to generate auth URL', error: error.message },
      { status: 500 }
    )
  }
}
