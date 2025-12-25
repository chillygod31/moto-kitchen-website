/**
 * Permission checks for different roles
 * 
 * Defines what each role can do within the tenant.
 */

import { TenantRole } from './rbac'

export interface Permission {
  resource: string
  action: string
}

/**
 * Check if a role has permission for a resource/action
 * 
 * @param role - User's role
 * @param resource - Resource being accessed (e.g., 'menu', 'orders')
 * @param action - Action being performed (e.g., 'create', 'update', 'delete')
 * @returns true if role has permission
 */
export function hasPermission(role: TenantRole, resource: string, action: string): boolean {
  const permissions = getRolePermissions(role)
  return permissions.some(
    (p) => p.resource === resource && p.action === action
  )
}

/**
 * Get all permissions for a role
 * 
 * @param role - User's role
 * @returns Array of permissions
 */
export function getRolePermissions(role: TenantRole): Permission[] {
  const basePermissions: Permission[] = [
    { resource: 'orders', action: 'read' },
    { resource: 'menu', action: 'read' },
  ]

  switch (role) {
    case 'owner':
      return [
        ...basePermissions,
        // Full access to everything
        { resource: 'orders', action: 'create' },
        { resource: 'orders', action: 'update' },
        { resource: 'orders', action: 'delete' },
        { resource: 'menu', action: 'create' },
        { resource: 'menu', action: 'update' },
        { resource: 'menu', action: 'delete' },
        { resource: 'settings', action: 'update' },
        { resource: 'billing', action: 'read' },
        { resource: 'billing', action: 'update' },
        { resource: 'members', action: 'read' },
        { resource: 'members', action: 'create' },
        { resource: 'members', action: 'update' },
        { resource: 'members', action: 'delete' },
      ]

    case 'admin':
      return [
        ...basePermissions,
        // Can manage orders and menu, but not billing or members
        { resource: 'orders', action: 'create' },
        { resource: 'orders', action: 'update' },
        { resource: 'menu', action: 'create' },
        { resource: 'menu', action: 'update' },
        { resource: 'menu', action: 'delete' },
        { resource: 'settings', action: 'update' },
        { resource: 'members', action: 'read' },
      ]

    case 'staff':
      return [
        ...basePermissions,
        // Can view and update orders, but limited menu access
        { resource: 'orders', action: 'update' },
        { resource: 'menu', action: 'read' },
      ]

    default:
      return basePermissions
  }
}

/**
 * Permission constants for easy reference
 */
export const Permissions = {
  Orders: {
    Read: 'orders:read',
    Create: 'orders:create',
    Update: 'orders:update',
    Delete: 'orders:delete',
  },
  Menu: {
    Read: 'menu:read',
    Create: 'menu:create',
    Update: 'menu:update',
    Delete: 'menu:delete',
  },
  Settings: {
    Update: 'settings:update',
  },
  Billing: {
    Read: 'billing:read',
    Update: 'billing:update',
  },
  Members: {
    Read: 'members:read',
    Create: 'members:create',
    Update: 'members:update',
    Delete: 'members:delete',
  },
} as const

