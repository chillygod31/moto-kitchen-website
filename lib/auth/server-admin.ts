/**
 * Server-side admin authentication helpers
 * Uses Supabase Auth + tenant_members for admin access
 */

import { createServerAuthClient } from '@/lib/supabase/server-auth'
import { NextRequest } from 'next/server'
import { User } from '@supabase/supabase-js'
import { getUserTenantMembership, TenantMember } from '@/lib/auth/rbac'

/**
 * Get authenticated admin user from request
 * Returns user if authenticated and is a tenant member
 */
export async function getAdminUser(request?: NextRequest): Promise<{
  user: User
  membership: TenantMember
} | null> {
  const supabase = await createServerAuthClient()
  
  // Get authenticated user
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  // Get user's tenant memberships
  // For MVP, use first membership (in future, could select tenant)
  const { getUserTenants } = await import('@/lib/auth/rbac')
  const memberships = await getUserTenants(user.id)
  
  if (!memberships || memberships.length === 0) {
    // User is authenticated but not a tenant member
    return null
  }

  // Use first membership (primary tenant)
  const membership = memberships[0]
  return { user, membership }
}

/**
 * Require admin authentication
 * Throws error if not authenticated or not a tenant member
 */
export async function requireAdminAuth(request?: NextRequest): Promise<{
  user: User
  membership: TenantMember
}> {
  const result = await getAdminUser(request)
  
  if (!result) {
    throw new Error('Unauthorized: Admin authentication required')
  }
  
  return result
}

/**
 * Get tenant ID from authenticated admin user
 * Throws error if not authenticated
 */
export async function getAdminTenantId(request?: NextRequest): Promise<string> {
  const result = await requireAdminAuth(request)
  return result.membership.tenant_id
}

/**
 * Check if user is authenticated admin
 */
export async function isAdminAuthenticated(request?: NextRequest): Promise<boolean> {
  const result = await getAdminUser(request)
  return result !== null
}

