import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/tenant'

/**
 * GET /api/delivery-zones
 * Get delivery zones/rules for the tenant
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const tenantId = await getTenantId('moto-kitchen')

    const { data: deliveryZones, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('fee', { ascending: true })

    if (error) {
      console.error('Error fetching delivery zones:', error)
      return NextResponse.json(
        { message: 'Failed to fetch delivery zones', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(deliveryZones || [])
  } catch (error: any) {
    console.error('Error in GET /api/delivery-zones:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

