import { NextRequest, NextResponse } from 'next/server'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { generateSlotsForTenant } from '@/lib/time-slots/generate-slots'

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization') || ''
  const cronSecret = process.env.CRON_SECRET || ''
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerAdminClient()
  const { data: tenants, error } = await supabase.from('tenants').select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let totalCreated = 0
  for (const t of tenants || []) {
    const result = await generateSlotsForTenant({ tenantId: t.id })
    if (!result.error) totalCreated += result.created
  }

  return NextResponse.json({ success: true, created: totalCreated })
}

