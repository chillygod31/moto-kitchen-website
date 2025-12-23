import { createServerClient } from '@/lib/supabase/server'

/**
 * Default branding values (fallback)
 */
export const DEFAULT_BRANDING = {
  logo_url: null,
  primary_color: '#C9653B',
  secondary_color: '#3A2A24',
  background_color: '#FAF6EF',
  text_color: '#1F1F1F',
  muted_color: '#4B4B4B',
  font_heading: 'Cormorant Garamond',
  font_body: 'Work Sans',
  radius_sm: '0.25rem',
  radius_md: '0.5rem',
  radius_lg: '0.75rem',
  logo_dark_url: null,
  shadow_sm: '0 1px 2px rgba(0,0,0,0.05)',
  shadow_md: '0 4px 6px rgba(0,0,0,0.1)',
}

/**
 * Tenant branding interface
 */
export interface TenantBranding {
  id?: string
  tenant_id: string
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
  background_color: string | null
  text_color: string | null
  muted_color: string | null
  font_heading: string | null
  font_body: string | null
  radius_sm: string | null
  radius_md: string | null
  radius_lg: string | null
  logo_dark_url: string | null
  shadow_sm: string | null
  shadow_md: string | null
  created_at?: string
  updated_at?: string
}

/**
 * Merged branding (with defaults applied)
 */
export interface MergedBranding {
  logo_url: string | null
  primary_color: string
  secondary_color: string
  background_color: string
  text_color: string
  muted_color: string
  font_heading: string
  font_body: string
  radius_sm: string
  radius_md: string
  radius_lg: string
  logo_dark_url: string | null
  shadow_sm: string
  shadow_md: string
}

/**
 * Get tenant branding from database
 * Returns null if not found
 */
export async function getTenantBranding(tenantId: string): Promise<TenantBranding | null> {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('tenant_branding')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()
  
  if (error) {
    console.error('Error fetching tenant branding:', error)
    return null
  }
  
  return data
}

/**
 * Get merged branding with defaults applied
 * Use this for applying branding to components
 */
export async function getMergedBranding(tenantId: string): Promise<MergedBranding> {
  const branding = await getTenantBranding(tenantId)
  
  if (!branding) {
    return DEFAULT_BRANDING as MergedBranding
  }
  
  return {
    logo_url: branding.logo_url,
    primary_color: branding.primary_color || DEFAULT_BRANDING.primary_color,
    secondary_color: branding.secondary_color || DEFAULT_BRANDING.secondary_color,
    background_color: branding.background_color || DEFAULT_BRANDING.background_color,
    text_color: branding.text_color || DEFAULT_BRANDING.text_color,
    muted_color: branding.muted_color || DEFAULT_BRANDING.muted_color,
    font_heading: branding.font_heading || DEFAULT_BRANDING.font_heading,
    font_body: branding.font_body || DEFAULT_BRANDING.font_body,
    radius_sm: branding.radius_sm || DEFAULT_BRANDING.radius_sm,
    radius_md: branding.radius_md || DEFAULT_BRANDING.radius_md,
    radius_lg: branding.radius_lg || DEFAULT_BRANDING.radius_lg,
    logo_dark_url: branding.logo_dark_url,
    shadow_sm: branding.shadow_sm || DEFAULT_BRANDING.shadow_sm,
    shadow_md: branding.shadow_md || DEFAULT_BRANDING.shadow_md,
  }
}

/**
 * Generate CSS variables from branding
 * Use this in admin layout to inject styles
 */
export function generateBrandingCSS(branding: MergedBranding): string {
  return `
    :root {
      --brand-primary: ${branding.primary_color};
      --brand-secondary: ${branding.secondary_color};
      --brand-background: ${branding.background_color};
      --brand-text: ${branding.text_color};
      --brand-muted: ${branding.muted_color};
      --font-heading: ${branding.font_heading};
      --font-body: ${branding.font_body};
      --radius-sm: ${branding.radius_sm};
      --radius-md: ${branding.radius_md};
      --radius-lg: ${branding.radius_lg};
      --shadow-sm: ${branding.shadow_sm};
      --shadow-md: ${branding.shadow_md};
    }
  `
}

