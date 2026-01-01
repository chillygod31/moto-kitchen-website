import { NextRequest, NextResponse } from 'next/server'
import { getAdminTenantId } from '@/lib/auth/server-admin'
import { createServerAdminClient } from '@/lib/supabase/server-admin'

export async function GET(request: NextRequest) {
  const tenantId = await getAdminTenantId(request)
  const supabase = createServerAdminClient()

  const searchParams = request.nextUrl.searchParams
  const daysParam = parseInt(searchParams.get('days') || '0', 10)
  const fulfillmentType = searchParams.get('fulfillment_type') || 'pickup'

  // Read admin window from template (fallback 7 days)
  const { data: settings } = await supabase
    .from('tenant_business_settings')
    .select('slot_template, blackout_dates')
    .eq('tenant_id', tenantId)
    .single()

  const template = settings?.slot_template || {}
  const daysAheadAdmin = daysParam > 0 ? daysParam : template.days_ahead_admin ?? 7

  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() + 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + daysAheadAdmin)

  const { data: slots, error } = await supabase
    .from('time_slots')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('fulfillment_type', fulfillmentType)
    .gte('slot_time', start.toISOString())
    .lt('slot_time', end.toISOString())
    .order('slot_time', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    slots: slots || [],
    blackout_dates: settings?.blackout_dates || [],
    template,
  })
}

export async function PATCH(request: NextRequest) {
  const tenantId = await getAdminTenantId(request)
  const supabase = createServerAdminClient()
  const { slotId, max_orders, is_active } = await request.json()

  const updates: any = { is_overridden: true }
  if (max_orders !== undefined) updates.max_orders = max_orders
  if (is_active !== undefined) updates.is_active = is_active

  const { error } = await supabase
    .from('time_slots')
    .update(updates)
    .eq('id', slotId)
    .eq('tenant_id', tenantId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function POST(request: NextRequest) {
  // Manage blackout dates
  const tenantId = await getAdminTenantId(request)
  const supabase = createServerAdminClient()
  const { action, date } = await request.json()

  const { data: settings } = await supabase
    .from('tenant_business_settings')
    .select('blackout_dates')
    .eq('tenant_id', tenantId)
    .single()

  let blackouts = settings?.blackout_dates || []
  if (action === 'add' && date && !blackouts.includes(date)) {
    blackouts = [...blackouts, date]
  } else if (action === 'remove') {
    blackouts = blackouts.filter((d: string) => d !== date)
  }

  const { error } = await supabase
    .from('tenant_business_settings')
    .update({ blackout_dates: blackouts })
    .eq('tenant_id', tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, blackout_dates: blackouts })
}

