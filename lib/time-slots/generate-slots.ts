import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { DateTime } from 'luxon'

type GenerateOptions = {
  tenantId: string
  fulfillmentType?: string
  daysAhead?: number
  insertMissingOnly?: boolean
  reset?: boolean
  startDateOverride?: string // ISO date
  endDateOverride?: string // ISO date
}

interface SlotTemplateWindow {
  start: string // "HH:MM"
  end: string // "HH:MM"
  interval_minutes: number
}

interface SlotTemplate {
  timezone: string
  days_ahead_customer: number
  days_ahead_admin?: number
  exclude_same_day: boolean
  windows: SlotTemplateWindow[]
  default_capacity: number
}

export async function generateSlotsForTenant(options: GenerateOptions) {
  const {
    tenantId,
    fulfillmentType = 'pickup',
    daysAhead,
    insertMissingOnly = true,
    reset = false,
    startDateOverride,
    endDateOverride,
  } = options

  const supabase = createServerAdminClient()

  const { data: settings, error: settingsError } = await supabase
    .from('tenant_business_settings')
    .select('slot_template, blackout_dates')
    .eq('tenant_id', tenantId)
    .single()

  if (settingsError || !settings?.slot_template) {
    return { created: 0, skipped: 0, error: 'No slot template found' }
  }

  const template: SlotTemplate = settings.slot_template
  const blackoutDates: string[] = settings.blackout_dates || []
  const timezone = template.timezone || 'Europe/Amsterdam'
  const windowDays = daysAhead ?? template.days_ahead_customer ?? 4

  const now = DateTime.now().setZone(timezone)
  const startDate = startDateOverride
    ? DateTime.fromISO(startDateOverride, { zone: timezone }).startOf('day')
    : template.exclude_same_day
    ? now.plus({ days: 1 }).startOf('day')
    : now.startOf('day')
  const endDate = endDateOverride
    ? DateTime.fromISO(endDateOverride, { zone: timezone }).endOf('day')
    : startDate.plus({ days: windowDays }).endOf('day')

  const slotsToUpsert: any[] = []

  let cursor = startDate
  while (cursor < endDate) {
    const dateStr = cursor.toISODate()
    if (blackoutDates.includes(dateStr)) {
      cursor = cursor.plus({ days: 1 })
      continue
    }

    for (const window of template.windows || []) {
      const [sh, sm] = window.start.split(':').map(Number)
      const [eh, em] = window.end.split(':').map(Number)

      let slotTime = cursor.set({ hour: sh, minute: sm, second: 0, millisecond: 0 })
      const windowEnd = cursor.set({ hour: eh, minute: em, second: 0, millisecond: 0 })

      while (slotTime < windowEnd) {
        slotsToUpsert.push({
          tenant_id: tenantId,
          fulfillment_type: fulfillmentType,
          slot_time: slotTime.toUTC().toISO(), // store UTC
          max_orders: template.default_capacity,
          current_orders: 0,
          is_active: true,
          is_available: true,
          generated_by_template: true,
        })
        slotTime = slotTime.plus({ minutes: window.interval_minutes })
      }
    }

    cursor = cursor.plus({ days: 1 })
  }

  // Upsert with idempotency. If inserting only missing slots, use onConflict with ignore.
  const upsertFn = supabase.from('time_slots')
  const conflictTarget = 'tenant_id,fulfillment_type,slot_time'

  if (insertMissingOnly && !reset) {
    const { error: insertError, data } = await upsertFn
      .upsert(slotsToUpsert, { onConflict: conflictTarget, ignoreDuplicates: true })
      .select()
    if (insertError) {
      return { created: 0, skipped: 0, error: insertError.message }
    }
    return { created: data?.length || 0, skipped: 0 }
  }

  // Reset flow: update template-derived fields for non-overridden slots; leave overridden alone
  const { error: upsertError, data } = await upsertFn
    .upsert(slotsToUpsert, { onConflict: conflictTarget })
    .select()

  if (upsertError) {
    return { created: 0, skipped: 0, error: upsertError.message }
  }

  // For reset, if slots are overridden, reapply template only when reset=true was explicitly requested
  if (reset) {
    const slotIds = (data || []).map((s: any) => s.id)
    if (slotIds.length > 0) {
      await supabase
        .from('time_slots')
        .update({
          max_orders: template.default_capacity,
          is_active: true,
          is_overridden: false,
          generated_by_template: true,
        })
        .in('id', slotIds)
        .eq('tenant_id', tenantId)
    }
  }

  return { created: data?.length || 0, skipped: 0 }
}

