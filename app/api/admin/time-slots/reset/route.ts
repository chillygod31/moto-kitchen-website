import { NextRequest, NextResponse } from 'next/server'
import { getAdminTenantId } from '@/lib/auth/server-admin'
import { generateSlotsForTenant } from '@/lib/time-slots/generate-slots'
import { createServerAdminClient } from '@/lib/supabase/server-admin'

// Reset a slot or an entire day to template defaults (clears overrides)
export async function POST(request: NextRequest) {
  const tenantId = await getAdminTenantId(request)
  const body = await request.json().catch(() => ({}))
  const { slot_id, date, fulfillment_type = 'pickup' } = body

  const supabase = createServerAdminClient()
  const { data: settings } = await supabase
    .from('tenant_business_settings')
    .select('slot_template')
    .eq('tenant_id', tenantId)
    .single()
  const template = settings?.slot_template

  if (slot_id) {
    const updates: any = {
      is_overridden: false,
      generated_by_template: true,
      is_active: true,
    }
    if (template?.default_capacity !== undefined) {
      updates.max_orders = template.default_capacity
    }

    const { error } = await supabase
      .from('time_slots')
      .update(updates)
      .eq('tenant_id', tenantId)
      .eq('id', slot_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (!date) {
    return NextResponse.json({ error: 'Provide slot_id or date' }, { status: 400 })
  }

  // For a whole date, regenerate that day with reset flag so template re-applies
  const result = await generateSlotsForTenant({
    tenantId,
    fulfillmentType: fulfillment_type,
    insertMissingOnly: false,
    reset: true,
    startDateOverride: date,
    endDateOverride: date,
  })

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

