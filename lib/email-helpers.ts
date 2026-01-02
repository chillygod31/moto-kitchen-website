import { createServerAdminClient } from '@/lib/supabase/server-admin'

/**
 * Get tenant email addresses with proper fallbacks
 * Implements the email address hierarchy from schema governance
 */
export async function getTenantEmailAddresses(tenantId: string) {
  const supabase = createServerAdminClient()
  
  const { data: tenant } = await supabase
    .from('tenants')
    .select('owner_email, business_email, business_phone, name')
    .eq('id', tenantId)
    .single()
  
  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`)
  }
  
  return {
    // Customer-facing contact (public, shown in templates + Reply-To)
    customerContact: tenant.business_email || tenant.owner_email || 'contact@motokitchen.nl',
    
    // Admin/internal alerts (private)
    adminAlert: tenant.owner_email || 'chilechhaa@gmail.com',
    
    // Business phone
    businessPhone: tenant.business_phone || '',
    
    // Business name
    businessName: tenant.name || 'Moto Kitchen',
  }
}

/**
 * Get "From" address for customer emails
 * Uses env var or falls back to no-reply
 */
export function getCustomerFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || 'Moto Kitchen <no-reply@motokitchen.nl>'
}

/**
 * Get "From" address for admin/internal emails
 */
export function getAdminFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || 'Moto Kitchen <alerts@motokitchen.nl>'
}

