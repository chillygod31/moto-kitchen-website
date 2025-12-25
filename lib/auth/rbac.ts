/**
 * Role-Based Access Control (RBAC) helpers
 * 
 * Functions for checking user roles and permissions within tenants.
 */

import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { User } from '@supabase/supabase-js'

export type TenantRole = 'owner' | 'admin' | 'staff'

export interface TenantMember {
  id: string
  tenant_id: string
  user_id: string
  role: TenantRole
  created_at: string
}

/**
 * Get user's tenant membership
 * 
 * @param userId - User ID from Supabase Auth
 * @param tenantId - Tenant ID
 * @returns Tenant member record or null
 */
export async function getUserTenantMembership(
  userId: string,
  tenantId: string
): Promise<TenantMember | null> {
  const supabase = createServerAdminClient()
  
  const { data, error } = await supabase
    .from('tenant_members')
    .select('*')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data as TenantMember
}

/**
 * Check if user has access to tenant
 * 
 * @param userId - User ID from Supabase Auth
 * @param tenantId - Tenant ID
 * @returns true if user is a member of the tenant
 */
export async function hasTenantAccess(userId: string, tenantId: string): Promise<boolean> {
  const membership = await getUserTenantMembership(userId, tenantId)
  return membership !== null
}

/**
 * Check if user has specific role in tenant
 * 
 * @param userId - User ID from Supabase Auth
 * @param tenantId - Tenant ID
 * @param role - Required role
 * @returns true if user has the required role or higher
 */
export async function hasRole(
  userId: string,
  tenantId: string,
  role: TenantRole
): Promise<boolean> {
  const membership = await getUserTenantMembership(userId, tenantId)
  
  if (!membership) {
    return false
  }
  
  // Role hierarchy: owner > admin > staff
  const roleHierarchy: Record<TenantRole, number> = {
    owner: 3,
    admin: 2,
    staff: 1,
  }
  
  const userRoleLevel = roleHierarchy[membership.role]
  const requiredRoleLevel = roleHierarchy[role]
  
  return userRoleLevel >= requiredRoleLevel
}

/**
 * Require user to have specific role in tenant
 * Throws error if user doesn't have the role
 * 
 * @param user - Supabase user object
 * @param tenantId - Tenant ID
 * @param role - Required role
 * @throws Error if user doesn't have the role
 */
export async function requireRole(
  user: User,
  tenantId: string,
  role: TenantRole
): Promise<TenantMember> {
  const membership = await getUserTenantMembership(user.id, tenantId)
  
  if (!membership) {
    throw new Error(`User is not a member of tenant ${tenantId}`)
  }
  
  const hasRequiredRole = await hasRole(user.id, tenantId, role)
  
  if (!hasRequiredRole) {
    throw new Error(`User does not have required role: ${role}`)
  }
  
  return membership
}

/**
 * Get all tenants user is a member of
 * 
 * @param userId - User ID from Supabase Auth
 * @returns Array of tenant memberships
 */
export async function getUserTenants(userId: string): Promise<TenantMember[]> {
  const supabase = createServerAdminClient()
  
  const { data, error } = await supabase
    .from('tenant_members')
    .select('*')
    .eq('user_id', userId)
  
  if (error || !data) {
    return []
  }
  
  return data as TenantMember[]
}

