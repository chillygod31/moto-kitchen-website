import { NextRequest, NextResponse } from 'next/server'
import { createServerAuthClient } from '@/lib/supabase/server-auth'
import { getAdminTenantId } from '@/lib/auth/server-admin'
import { verifyCsrfToken } from '@/lib/csrf'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'

/**
 * GET /api/admin/events/item-defaults
 * Get all item defaults for the tenant
 */
export async function GET(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)
  try {
    const supabase = await createServerAuthClient()
    const tenantId = await getAdminTenantId(request)

    const { data, error } = await supabase
      .from('event_item_defaults')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('item_name')

    if (error) {
      logger.api.error('GET', '/api/admin/events/item-defaults', error as Error, { ...context, tenantId })
      return NextResponse.json({ message: 'Failed to fetch defaults', error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/events/item-defaults
 * Upsert item defaults (bulk)
 */
export async function POST(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)

  const isValidCsrf = await verifyCsrfToken(request)
  if (!isValidCsrf) {
    return NextResponse.json({ message: 'CSRF token missing or invalid' }, { status: 403 })
  }

  try {
    const supabase = await createServerAuthClient()
    const tenantId = await getAdminTenantId(request)
    const body = await request.json()
    const { items } = body

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ message: 'Items array is required' }, { status: 400 })
    }

    const rows = items.map((item: any) => ({
      tenant_id: tenantId,
      item_name: item.item_name,
      category: item.category || null,
      cost_per_kg: item.cost_per_kg ?? null,
      cost_per_piece: item.cost_per_piece ?? null,
      default_sell_price: item.default_sell_price ?? null,
      unit: item.unit || 'kg',
    }))

    const { data, error } = await supabase
      .from('event_item_defaults')
      .upsert(rows, { onConflict: 'tenant_id,item_name' })
      .select()

    if (error) {
      logger.api.error('POST', '/api/admin/events/item-defaults', error as Error, { ...context, tenantId })
      captureException(error as Error, { ...context, tenantId })
      return NextResponse.json({ message: 'Failed to save defaults', error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 })
  }
}
