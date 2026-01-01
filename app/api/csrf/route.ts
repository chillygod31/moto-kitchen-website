import { NextResponse } from 'next/server'
import { getCsrfToken } from '@/lib/csrf'

/**
 * GET /api/csrf
 * Returns CSRF token for client-side use
 * Token is also stored in an httpOnly cookie
 */
export async function GET() {
  const token = await getCsrfToken()
  
  return NextResponse.json({ csrfToken: token })
}

