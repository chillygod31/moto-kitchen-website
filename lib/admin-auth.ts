import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { getTenantId } from '@/lib/tenant'

/**
 * Admin session cookie name
 */
const ADMIN_SESSION_COOKIE = 'admin_session'

/**
 * Admin session interface
 */
export interface AdminSession {
  authenticated: boolean
  tenantId: string
  tenantSlug: string
  expiresAt: number
}

/**
 * Create admin session
 * Stores tenant context in secure httpOnly cookie
 */
export async function createAdminSession(tenantSlug: string = 'moto-kitchen') {
  const tenantId = await getTenantId(tenantSlug)
  
  const session: AdminSession = {
    authenticated: true,
    tenantId,
    tenantSlug,
    expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
  }

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  })

  return session
}

/**
 * Get admin session from request
 * Returns null if not authenticated or expired
 */
export async function getAdminSession(request?: NextRequest): Promise<AdminSession | null> {
  let sessionData: string | undefined

  if (request) {
    // Extract from request cookies
    sessionData = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  } else {
    // Extract from server cookies (for server components)
    const cookieStore = await cookies()
    sessionData = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  }

  if (!sessionData) {
    return null
  }

  try {
    const session: AdminSession = JSON.parse(sessionData)

    // Check if expired
    if (session.expiresAt < Date.now()) {
      await clearAdminSession()
      return null
    }

    // Validate session structure
    if (!session.authenticated || !session.tenantId || !session.tenantSlug) {
      return null
    }

    return session
  } catch (error) {
    console.error('Error parsing admin session:', error)
    return null
  }
}

/**
 * Get tenant ID from admin session
 * Throws error if not authenticated
 */
export async function getAdminTenantId(request?: NextRequest): Promise<string> {
  const session = await getAdminSession(request)
  
  if (!session) {
    throw new Error('Unauthorized: Admin session not found')
  }

  return session.tenantId
}

/**
 * Get tenant slug from admin session
 * Throws error if not authenticated
 */
export async function getAdminTenantSlug(request?: NextRequest): Promise<string> {
  const session = await getAdminSession(request)
  
  if (!session) {
    throw new Error('Unauthorized: Admin session not found')
  }

  return session.tenantSlug
}

/**
 * Clear admin session (logout)
 */
export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_SESSION_COOKIE)
}

/**
 * Verify admin authentication
 * Returns true if authenticated, false otherwise
 */
export async function isAdminAuthenticated(request?: NextRequest): Promise<boolean> {
  const session = await getAdminSession(request)
  return session !== null && session.authenticated === true
}

/**
 * Verify user has access to specific tenant
 * Used for additional security checks
 */
export async function verifyTenantAccess(request: NextRequest, tenantId: string): Promise<boolean> {
  const session = await getAdminSession(request)
  
  if (!session) {
    return false
  }

  // In MVP: admin can only access their own tenant
  // In SaaS: could check tenant_members table for multi-tenant access
  return session.tenantId === tenantId
}

