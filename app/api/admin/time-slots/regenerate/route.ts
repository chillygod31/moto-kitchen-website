import { NextRequest, NextResponse } from 'next/server'
import { getAdminTenantId } from '@/lib/auth/server-admin'
import { generateSlotsForTenant } from '@/lib/time-slots/generate-slots'
import { createServerAdminClient } from '@/lib/supabase/server-admin'

export async function POST(request: NextRequest) {
  const tenantId = await getAdminTenantId(request)
  const body = await request.json().catch(() => ({}))
  const {
    days_ahead = 4,
    fulfillment_type = 'pickup',
    apply_rules = false,
    template,
    reset = false,
  } = body

  const supabase = createServerAdminClient()

  // Optionally save template
  if (apply_rules && template) {
    const { error: templateError } = await supabase
      .from('tenant_business_settings')
      .update({ slot_template: template })
      .eq('tenant_id', tenantId)

    if (templateError) {
      return NextResponse.json({ error: templateError.message }, { status: 500 })
    }
  }

  const result = await generateSlotsForTenant({
    tenantId,
    fulfillmentType: fulfillment_type,
    daysAhead: days_ahead,
    insertMissingOnly: !reset,
    reset,
  })

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true, created: result.created })
}
