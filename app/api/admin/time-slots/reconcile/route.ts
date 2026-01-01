import { NextRequest, NextResponse } from 'next/server'
import { getAdminTenantId } from '@/lib/auth/server-admin'
import { createServerAdminClient } from '@/lib/supabase/server-admin'

// Recalculate booked counts from orders and update current_orders for the given range
export async function POST(request: NextRequest) {
  const tenantId = await getAdminTenantId(request)
  const body = await request.json().catch(() => ({}))
  const {
    start_date,
    end_date,
    fulfillment_type = 'pickup',
  }: { start_date?: string; end_date?: string; fulfillment_type?: string } = body

  if (!start_date || !end_date) {
    return NextResponse.json({ error: 'start_date and end_date required' }, { status: 400 })
  }

  const supabase = createServerAdminClient()

  // Fetch slots in range
  const { data: slots, error: slotsError } = await supabase
    .from('time_slots')
    .select('id, slot_time')
    .eq('tenant_id', tenantId)
    .eq('fulfillment_type', fulfillment_type)
    .gte('slot_time', new Date(start_date).toISOString())
    .lte('slot_time', new Date(end_date).toISOString())

  if (slotsError) {
    return NextResponse.json({ error: slotsError.message }, { status: 500 })
  }

  const slotIds = (slots || []).map((s) => s.id)
  if (slotIds.length === 0) {
    return NextResponse.json({ success: true, updated: 0 })
  }

  // Count paid orders per slot
  const { data: orderCounts, error: countError } = await supabase
    .from('orders')
    .select('time_slot_id, payment_status', { count: 'exact', head: false })
    .in('time_slot_id', slotIds)
    .eq('tenant_id', tenantId)
    .eq('payment_status', 'paid')

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 })
  }

  const countMap: Record<string, number> = {}
  for (const row of orderCounts || []) {
    if (!row.time_slot_id) continue
    countMap[row.time_slot_id] = (countMap[row.time_slot_id] || 0) + 1
  }

  // Update each slot with computed count
  for (const slot of slots || []) {
    const newCount = countMap[slot.id] || 0
    await supabase
      .from('time_slots')
      .update({ current_orders: newCount })
      .eq('id', slot.id)
      .eq('tenant_id', tenantId)
  }

  return NextResponse.json({ success: true, updated: slots?.length || 0 })
}

