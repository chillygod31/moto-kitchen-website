import { NextRequest, NextResponse } from 'next/server'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { getTenantId } from '@/lib/tenant'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'

/**
 * GET /api/time-slots
 * Get available time slots for the next 7 days
 * 
 * Query parameters:
 * - fulfillment_type: 'pickup' | 'delivery' (optional, defaults to 'pickup')
 * - delivery_zone_id: UUID (optional, for delivery slots)
 * 
 * NOTE: Uses service role client temporarily because RLS blocks public SELECT.
 * Tenant isolation is enforced via .eq('tenant_id', tenantId) filtering.
 * TODO: Future - use proper tenant-scoped access when implemented.
 */
export async function GET(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('GET', '/api/time-slots', context)
  
  try {
    // Temporary: Use service role because RLS blocks anon SELECT
    // Tenant isolation enforced via app-level filtering (.eq('tenant_id', ...))
    const supabase = createServerAdminClient()
    const tenantId = await getTenantId()

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const fulfillmentType = (searchParams.get('fulfillment_type') || 'pickup') as 'pickup' | 'delivery'
    const deliveryZoneId = searchParams.get('delivery_zone_id')

    // Get business settings for blackout dates, lead time, and capacity
    const { data: businessSettings } = await supabase
      .from('tenant_business_settings')
      .select('blackout_dates, lead_time_minutes, max_orders_per_slot, max_orders_per_pickup_slot, max_orders_per_delivery_window')
      .eq('tenant_id', tenantId)
      .single()

    const blackoutDates = businessSettings?.blackout_dates || []
    const leadTimeMinutes = businessSettings?.lead_time_minutes || 120
    
    // Use fulfillment-specific capacity if available, otherwise fall back to general capacity
    const maxOrders = fulfillmentType === 'delivery' 
      ? (businessSettings?.max_orders_per_delivery_window || businessSettings?.max_orders_per_slot || 5)
      : (businessSettings?.max_orders_per_pickup_slot || businessSettings?.max_orders_per_slot || 10)

    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    // Calculate minimum allowed slot time (now + lead time)
    const minSlotTime = new Date(now.getTime() + leadTimeMinutes * 60 * 1000)

    // Build query - filter by fulfillment_type
    let query = supabase
      .from('time_slots')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_available', true)

    // Filter by fulfillment_type (if column exists, otherwise show all)
    // For backward compatibility, if fulfillment_type is null, show for pickup
    if (fulfillmentType === 'delivery') {
      query = query.or('fulfillment_type.eq.delivery,fulfillment_type.is.null')
    } else {
      query = query.or('fulfillment_type.eq.pickup,fulfillment_type.is.null')
    }

    // Filter by delivery zone if provided
    if (fulfillmentType === 'delivery' && deliveryZoneId) {
      query = query.or(`delivery_zone_id.eq.${deliveryZoneId},delivery_zone_id.is.null`)
    }

    // Filter by time range - use start_time if available, otherwise slot_time for backward compatibility
    // We'll filter in JavaScript after fetching to handle the OR condition properly
    query = query.order('slot_time', { ascending: true })

    const { data: timeSlots, error } = await query

    if (error) {
      logger.api.error('GET', '/api/time-slots', error as Error, { ...context, tenantId })
      captureException(error as Error, { ...context, tenantId })
      return NextResponse.json(
        { message: 'Failed to fetch time slots', error: error.message },
        { status: 500 }
      )
    }

    // Filter slots based on business rules and time range
    const availableSlots = (timeSlots || []).filter((slot) => {
      // Use start_time if available, otherwise fall back to slot_time for backward compatibility
      const slotTime = slot.start_time ? new Date(slot.start_time) : new Date(slot.slot_time)
      const slotEndTime = slot.end_time ? new Date(slot.end_time) : null
      
      // 0. Check time range (start_time must be within next 7 days)
      if (slotTime < now || slotTime > sevenDaysLater) {
        return false
      }
      
      // 1. Check lead time cutoff
      if (slotTime < minSlotTime) {
        return false
      }

      // 2. Check blackout dates
      const slotDate = slotTime.toISOString().split('T')[0] // YYYY-MM-DD
      if (blackoutDates.includes(slotDate)) {
        return false
      }

      // 3. Check slot capacity
      if (slot.current_orders >= maxOrders) {
        return false
      }

      return true
    })

    logger.info('Time slots fetched successfully', { 
      ...context, 
      tenantId, 
      fulfillmentType,
      totalSlots: timeSlots?.length || 0, 
      availableSlots: availableSlots.length,
      filteredBy: {
        leadTime: leadTimeMinutes,
        blackoutDates: blackoutDates.length,
        capacity: maxOrders
      }
    })
    return NextResponse.json(availableSlots)
  } catch (error: any) {
    logger.api.error('GET', '/api/time-slots', error, context)
    captureException(error, context)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

