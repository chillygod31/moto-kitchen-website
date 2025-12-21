import { createServerClient } from '@/lib/supabase/server'

/**
 * Get tenant ID by slug
 * For MVP: Defaults to 'moto-kitchen'
 * In Phase 2: Will extract from subdomain/path
 */
export async function getTenantId(slug: string = 'moto-kitchen'): Promise<string> {
  const supabase = createServerClient()
  
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
 */
export async function getTenant(slug: string = 'moto-kitchen') {
  const supabase = createServerClient()
  
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

