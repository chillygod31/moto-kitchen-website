import { NextRequest, NextResponse } from 'next/server'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { getTenantId } from '@/lib/tenant'

/**
 * GET /api/time-slots
 * Get available time slots for the next 7 days
 * 
 * NOTE: Uses service role client temporarily because RLS blocks public SELECT.
 * Tenant isolation is enforced via .eq('tenant_id', tenantId) filtering.
 * TODO: Future - use proper tenant-scoped access when implemented.
 */
export async function GET(request: NextRequest) {
  try {
    // Temporary: Use service role because RLS blocks anon SELECT
    // Tenant isolation enforced via app-level filtering (.eq('tenant_id', ...))
    const supabase = createServerAdminClient()
    const tenantId = await getTenantId()

    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const { data: timeSlots, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_available', true)
      .gte('slot_time', now.toISOString())
      .lte('slot_time', sevenDaysLater.toISOString())
      .order('slot_time', { ascending: true })

    if (error) {
      console.error('Error fetching time slots:', error)
      return NextResponse.json(
        { message: 'Failed to fetch time slots', error: error.message },
        { status: 500 }
      )
    }

    // Filter out slots that are full
    const availableSlots = (timeSlots || []).filter(
      (slot) => slot.current_orders < slot.max_orders
    )

    return NextResponse.json(availableSlots)
  } catch (error: any) {
    console.error('Error in GET /api/time-slots:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

