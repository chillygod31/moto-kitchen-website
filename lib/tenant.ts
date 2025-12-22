import { createServerClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

/**
 * Extract tenant slug from hostname
 * Phase 1 (MVP): Always returns 'moto-kitchen'
 * Phase 2 (SaaS): Will support:
 *   - order.motokitchen.nl → 'moto-kitchen'
 *   - custom-domain.com → lookup in tenant_domains table
 *   - tenant-slug.orderapp.com → extract from subdomain
 */
async function getTenantSlugFromHostname(hostname?: string | null): Promise<string> {
  // Phase 1: Default to 'moto-kitchen' for MVP
  // Phase 2: Implement subdomain/domain detection here
  if (!hostname) {
    return 'moto-kitchen'
  }

  // TODO Phase 2: Extract subdomain logic
  // const parts = hostname.split('.')
  // if (parts.length >= 3) {
  //   const subdomain = parts[0]
  //   // Map subdomain to tenant slug
  // }

  // TODO Phase 2: Check custom domains
  // const { data: domain } = await supabase
  //   .from('tenant_domains')
  //   .select('tenant_id')
  //   .eq('domain', hostname)
  //   .single()

  return 'moto-kitchen'
}

/**
 * Get tenant ID
 * Auto-detects tenant from hostname if slug not provided
 * 
 * @param slug - Optional tenant slug. If not provided, detects from hostname
 */
export async function getTenantId(slug?: string): Promise<string> {
  const supabase = createServerClient()
  
  // If slug not provided, try to detect from hostname
  if (!slug) {
    const headersList = await headers()
    const hostname = headersList.get('host') || undefined
    slug = await getTenantSlugFromHostname(hostname)
  }
  
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single()
  
  if (error || !tenant) {
    throw new Error(`Tenant not found: ${slug}`)
  }
  
  return tenant.id
}

/**
 * Get tenant by slug
 * Returns full tenant object
 * Auto-detects tenant from hostname if slug not provided
 * 
 * @param slug - Optional tenant slug. If not provided, detects from hostname
 */
export async function getTenant(slug?: string) {
  const supabase = createServerClient()
  
  // If slug not provided, try to detect from hostname
  if (!slug) {
    const headersList = await headers()
    const hostname = headersList.get('host') || undefined
    slug = await getTenantSlugFromHostname(hostname)
  }
  
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single()
  
  if (error || !tenant) {
    throw new Error(`Tenant not found: ${slug}`)
  }
  
  return tenant
}

/**
 * Get tenant slug from hostname (for external use)
 */
export async function getTenantSlug(hostname?: string | null): Promise<string> {
  return getTenantSlugFromHostname(hostname)
}

