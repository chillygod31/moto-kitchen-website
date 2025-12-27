import { NextRequest, NextResponse } from 'next/server'
import { createServerAuthClient } from '@/lib/supabase/server-auth'
import { requireAdminAuth, getAdminTenantId } from '@/lib/auth/server-admin'
import { requireRole } from '@/lib/auth/rbac'
import { verifyCsrfToken } from '@/lib/csrf'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'

/**
 * GET /api/admin/business-settings
 * Get tenant business settings (admin only)
 * Staff and owner can view
 */
export async function GET(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('GET', '/api/admin/business-settings', context)
  
  try {
    // Use JWT-based client so RLS policies apply
    const supabase = await createServerAuthClient()
    const tenantId = await getAdminTenantId(request)

    // Get business settings (RLS will enforce tenant isolation)
    const { data: settings, error: settingsError } = await supabase
      .from('tenant_business_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 = not found
      logger.api.error('GET', '/api/admin/business-settings', settingsError as Error, { ...context, tenantId })
      captureException(settingsError as Error, { ...context, tenantId })
      return NextResponse.json(
        { message: 'Failed to fetch business settings', error: settingsError.message },
        { status: 500 }
      )
    }

    // Get tenant info (for business_email, business_phone)
    // RLS will enforce tenant isolation
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('business_email, business_phone, name')
      .eq('id', tenantId)
      .single()

    if (tenantError) {
      logger.warn('Error fetching tenant info', { ...context, tenantId, error: tenantError.message })
    }

    // Merge settings with tenant info
    const mergedSettings = {
      ...settings,
      business_email: tenant?.business_email || null,
      business_phone: tenant?.business_phone || null,
      business_name: tenant?.name || null,
    }

    logger.info('Business settings fetched successfully', { ...context, tenantId })
    return NextResponse.json(mergedSettings)
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin authentication required') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }
    logger.api.error('GET', '/api/admin/business-settings', error, context)
    captureException(error, context)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/business-settings
 * Update tenant business settings (owner only)
 * Per ENGINEERING_TRUTH.md: staff cannot change business-critical settings
 */
export async function PATCH(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('PATCH', '/api/admin/business-settings', context)
  
  // Verify CSRF token
  const isValidCsrf = await verifyCsrfToken(request)
  if (!isValidCsrf) {
    logger.warn('CSRF token missing or invalid', { ...context, path: '/api/admin/business-settings' })
    return NextResponse.json(
      { message: 'CSRF token missing or invalid' },
      { status: 403 }
    )
  }

  try {
    // Require admin authentication and get user + membership
    const { user, membership } = await requireAdminAuth(request)
    const tenantId = membership.tenant_id

    // RBAC: Only owner can update business settings (staff cannot)
    await requireRole(user, tenantId, 'owner')

    // Use JWT-based client so RLS policies apply
    const supabase = await createServerAuthClient()
    const body = await request.json()

    // Separate tenant fields from business_settings fields
    const {
      business_email,
      business_phone,
      business_name,
      ...businessSettingsFields
    } = body

    // Update tenant table if business_email or business_phone provided
    // RLS will enforce tenant isolation
    if (business_email !== undefined || business_phone !== undefined || business_name !== undefined) {
      const tenantUpdate: any = {}
      if (business_email !== undefined) tenantUpdate.business_email = business_email
      if (business_phone !== undefined) tenantUpdate.business_phone = business_phone
      if (business_name !== undefined) tenantUpdate.name = business_name

      const { error: tenantError } = await supabase
        .from('tenants')
        .update(tenantUpdate)
        .eq('id', tenantId)

      if (tenantError) {
        logger.api.error('PATCH', '/api/admin/business-settings', tenantError as Error, { ...context, tenantId })
        return NextResponse.json(
          { message: 'Failed to update tenant info', error: tenantError.message },
          { status: 500 }
        )
      }
    }

    // Update business_settings if any fields provided
    // RLS will enforce tenant isolation
    if (Object.keys(businessSettingsFields).length > 0) {
      // Ensure tenant_id is set and add updated_at
      const updateData = {
        ...businessSettingsFields,
        tenant_id: tenantId,
        updated_at: new Date().toISOString(),
      }

      const { error: settingsError } = await supabase
        .from('tenant_business_settings')
        .upsert(updateData, {
          onConflict: 'tenant_id',
        })

      if (settingsError) {
        logger.api.error('PATCH', '/api/admin/business-settings', settingsError as Error, { ...context, tenantId })
        captureException(settingsError as Error, { ...context, tenantId })
        return NextResponse.json(
          { message: 'Failed to update business settings', error: settingsError.message },
          { status: 500 }
        )
      }
    }

    logger.info('Business settings updated successfully', { ...context, tenantId, role: membership.role })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin authentication required') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }
    if (error.message?.includes('required role')) {
      logger.warn('RBAC: Staff attempted to update business settings', { ...context, error: error.message })
      return NextResponse.json(
        { message: 'Forbidden: Only owners can update business settings' },
        { status: 403 }
      )
    }
    logger.api.error('PATCH', '/api/admin/business-settings', error, context)
    captureException(error, context)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

