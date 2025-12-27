import { NextRequest, NextResponse } from 'next/server'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { getTenantId } from '@/lib/tenant'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'

/**
 * GET /api/business-settings
 * Get tenant business settings
 * For customer-facing: uses auto-detection
 * For admin: should use getAdminTenantId
 * 
 * NOTE: Uses service role client temporarily because RLS blocks public SELECT.
 * Tenant isolation is enforced via .eq('tenant_id', tenantId) filtering.
 * TODO: Future - use proper tenant-scoped access when implemented.
 */
export async function GET(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('GET', '/api/business-settings', context)
  
  try {
    // Temporary: Use service role because RLS blocks anon SELECT
    // Tenant isolation enforced via app-level filtering (.eq('tenant_id', ...))
    const supabase = createServerAdminClient()
    
    // Customer-facing endpoint - use auto-detection
    const tenantId = await getTenantId()

    const { data: settings, error } = await supabase
      .from('tenant_business_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      logger.warn('Error fetching business settings, returning defaults', { ...context, tenantId, error: error.message })
      // Return default settings if not found
      return NextResponse.json({
        min_order_value: 0,
        timezone: 'Europe/Amsterdam',
        service_types: ['pickup', 'delivery'],
        business_hours: null,
        lead_time_minutes: 120,
        accepting_orders: true,
      })
    }

    logger.info('Business settings fetched successfully', { ...context, tenantId })
    return NextResponse.json(settings || {
      min_order_value: 0,
      timezone: 'Europe/Amsterdam',
      service_types: ['pickup', 'delivery'],
      business_hours: null,
      lead_time_minutes: 120,
      accepting_orders: true,
    })
  } catch (error: any) {
    logger.api.error('GET', '/api/business-settings', error, context)
    captureException(error, context)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

