import { NextRequest, NextResponse } from 'next/server'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { getTenantId } from '@/lib/tenant'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'
import { DateTime } from 'luxon'

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
    const supabase = createServerAdminClient()
    const tenantId = await getTenantId()

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const fulfillmentType = (searchParams.get('fulfillment_type') || 'pickup') as 'pickup' | 'delivery'

    // Fetch template + blackout
    const { data: settings, error: settingsError } = await supabase
      .from('tenant_business_settings')
      .select('slot_template, blackout_dates')
      .eq('tenant_id', tenantId)
      .single()

    if (settingsError) {
      return NextResponse.json({ message: 'No slot settings found' }, { status: 400 })
    }

    const template = settings?.slot_template || {}
    const blackoutDates: string[] = settings?.blackout_dates || []
    const tz = template.timezone || 'Europe/Amsterdam'
    const daysAhead = template.days_ahead_customer ?? 14 // Default 2 weeks to ensure Saturday is included
    const excludeSameDay = template.exclude_same_day ?? true
    const minLeadMinutes = template.min_lead_time_minutes ?? 180

    const nowTz = DateTime.now().setZone(tz)
    const leadCutoff = nowTz.plus({ minutes: minLeadMinutes }).toUTC().toISO() || ''
    const start = excludeSameDay ? nowTz.plus({ days: 1 }).startOf('day') : nowTz.startOf('day')
    const end = start.plus({ days: daysAhead }).endOf('day')

    const { data: timeSlots, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('fulfillment_type', fulfillmentType)
      .eq('is_active', true)
      .gte('slot_time', start.toUTC().toISO())
      .lt('slot_time', end.toUTC().toISO())
      .order('slot_time', { ascending: true })

    if (error) {
      logger.api.error('GET', '/api/time-slots', error as Error, { ...context, tenantId })
      captureException(error as Error, { ...context, tenantId })
      return NextResponse.json({ message: 'Failed to fetch time slots', error: error.message }, { status: 500 })
    }

    // Get allowed days from template (default to Saturday only for pickup)
    // Day convention: 0=Sunday, 1=Monday, ..., 6=Saturday (JavaScript standard)
    const allowedDays = template.allowed_days || (fulfillmentType === 'pickup' ? [6] : [0, 1, 2, 3, 4, 5, 6])

    const availableSlots = (timeSlots || []).filter((slot) => {
      if (!slot.slot_time) return false
      const slotTime = DateTime.fromISO(slot.slot_time)
      const slotDate = slotTime.setZone(tz).toISODate()
      if (!slotDate) return false

      // Filter by allowed days of week
      // Luxon weekday: 1=Monday...7=Sunday -> convert to JS: 0=Sunday...6=Saturday
      const dayOfWeek = slotTime.setZone(tz).weekday % 7
      if (!allowedDays.includes(dayOfWeek)) return false

      if (blackoutDates.includes(slotDate)) return false
      // lead time
      const slotTimeISO = slotTime.toUTC().toISO()
      if (!slotTimeISO || slotTimeISO < leadCutoff) return false
      if (slot.max_orders !== null && slot.max_orders !== undefined) {
        return slot.current_orders < slot.max_orders
      }
      return true
    })

    logger.info('Time slots fetched successfully', {
      ...context,
      tenantId,
      fulfillmentType,
      totalSlots: timeSlots?.length || 0,
      availableSlots: availableSlots.length,
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

