import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { headers } from 'next/headers'

/**
 * Extract tenant slug from hostname
 * Supports:
 *   - order.motokitchen.nl / orders.motokitchen.nl → 'moto-kitchen' (pattern match)
 *   - motokitchen.nl → 'moto-kitchen' (pattern match)
 *   - custom-domain.com → lookup in tenant_domains table
 *   - Default: 'moto-kitchen' for MVP
 */
async function getTenantSlugFromHostname(hostname?: string | null, supabase?: any): Promise<string> {
  if (!hostname) {
    return 'moto-kitchen'
  }

  // Remove port if present (e.g., localhost:3000 → localhost)
  const cleanHostname = hostname.split(':')[0].toLowerCase()

  // Pattern-based resolution for known subdomains
  if (cleanHostname.startsWith('order.') || cleanHostname.startsWith('orders.')) {
    return 'moto-kitchen'
  }

  // For root domain motokitchen.nl (or localhost in dev)
  if (cleanHostname === 'motokitchen.nl' || cleanHostname === 'localhost' || cleanHostname === '127.0.0.1') {
    return 'moto-kitchen'
  }

  // For custom domains, lookup in tenant_domains table
  if (supabase) {
    try {
      const { data: domain, error } = await supabase
        .from('tenant_domains')
        .select('tenant_id, tenants!inner(slug)')
        .eq('domain', cleanHostname)
        .eq('is_verified', true)
        .single()

      if (!error && domain && domain.tenants) {
        return (domain.tenants as any).slug
      }
    } catch (error) {
      console.error('Error looking up tenant domain:', error)
    }
  }

  // Default fallback
  return 'moto-kitchen'
}

/**
 * Get tenant ID
 * Auto-detects tenant from middleware headers or hostname if slug not provided
 * 
 * @param slug - Optional tenant slug. If not provided, uses middleware headers or detects from hostname
 */
export async function getTenantId(slug?: string): Promise<string> {
  // First, try to get tenant ID from middleware headers (fastest)
  if (!slug) {
    try {
      const headersList = await headers()
      const tenantIdFromHeader = headersList.get('x-tenant-id')
      if (tenantIdFromHeader) {
        return tenantIdFromHeader
      }
      
      // Try slug from header
      const tenantSlugFromHeader = headersList.get('x-tenant-slug')
      if (tenantSlugFromHeader) {
        slug = tenantSlugFromHeader
      }
    } catch (error) {
      // Headers() can throw in some contexts, fall through to detection
    }
  }
  
  const supabase = createServerAdminClient()
  
  // If slug not provided yet, try to detect from hostname
  if (!slug) {
    const headersList = await headers()
    const hostname = headersList.get('host') || undefined
    slug = await getTenantSlugFromHostname(hostname, supabase)
  }
  
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, status')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()
  
  if (error || !tenant) {
    throw new Error(`Tenant not found: ${slug}`)
  }
  
  return tenant.id
}

/**
 * Get tenant by slug
 * Returns full tenant object
 * Auto-detects tenant from middleware headers or hostname if slug not provided
 * 
 * @param slug - Optional tenant slug. If not provided, uses middleware headers or detects from hostname
 */
export async function getTenant(slug?: string) {
  // First, try to get tenant slug from middleware headers
  if (!slug) {
    try {
      const headersList = await headers()
      const tenantSlugFromHeader = headersList.get('x-tenant-slug')
      if (tenantSlugFromHeader) {
        slug = tenantSlugFromHeader
      }
    } catch (error) {
      // Headers() can throw in some contexts, fall through to detection
    }
  }
  
  const supabase = createServerAdminClient()
  
  // If slug not provided yet, try to detect from hostname
  if (!slug) {
    const headersList = await headers()
    const hostname = headersList.get('host') || undefined
    slug = await getTenantSlugFromHostname(hostname, supabase)
  }
  
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()
  
  if (error || !tenant) {
    throw new Error(`Tenant not found: ${slug}`)
  }
  
  return tenant
}

/**
 * Get tenant slug from hostname (for external use)
 * Can optionally provide supabase client for DB lookup
 */
export async function getTenantSlug(hostname?: string | null, supabase?: any): Promise<string> {
  return getTenantSlugFromHostname(hostname, supabase)
}

/**
 * Resolve tenant from path pattern
 * Supports: /order/* → 'moto-kitchen'
 */
export function getTenantSlugFromPath(pathname: string): string | null {
  // Pattern-based resolution for path-based routing
  if (pathname.startsWith('/order')) {
    return 'moto-kitchen'
  }
  
  return null
}

