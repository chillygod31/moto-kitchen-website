import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/tenant'

/**
 * GET /api/business-settings
 * Get tenant business settings
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const tenantId = await getTenantId()

    const { data: settings, error } = await supabase
      .from('tenant_business_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      console.error('Error fetching business settings:', error)
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

    return NextResponse.json(settings || {
      min_order_value: 0,
      timezone: 'Europe/Amsterdam',
      service_types: ['pickup', 'delivery'],
      business_hours: null,
      lead_time_minutes: 120,
      accepting_orders: true,
    })
  } catch (error: any) {
    console.error('Error in GET /api/business-settings:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

