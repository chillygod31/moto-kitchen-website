import { NextRequest, NextResponse } from 'next/server'
import { createServerAuthClient } from '@/lib/supabase/server-auth'
import { getAdminTenantId } from '@/lib/auth/server-admin'
import { verifyCsrfToken } from '@/lib/csrf'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'

/**
 * POST /api/admin/events/[id]/prep-items
 * Bulk add prep items to an event
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = getTenantContextFromHeaders(request.headers)
  const { id: eventId } = await params
  logger.api.request('POST', `/api/admin/events/${eventId}/prep-items`, context)

  const isValidCsrf = await verifyCsrfToken(request)
  if (!isValidCsrf) {
    return NextResponse.json(
      { message: 'CSRF token missing or invalid' },
      { status: 403 }
    )
  }

  try {
    const supabase = await createServerAuthClient()
    const tenantId = await getAdminTenantId(request)

    // Verify event belongs to tenant
    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('tenant_id', tenantId)
      .single()

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    const body = await request.json()
    const { items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: 'Items array is required' },
        { status: 400 }
      )
    }

    const rows = items.map((item: any, index: number) => ({
      event_id: eventId,
      item_name: item.item_name,
      category: item.category || null,
      planned_qty: item.planned_qty || 0,
      planned_kg: item.planned_kg || null,
      planned_boxes: item.planned_boxes || null,
      cost_per_kg: item.cost_per_kg || null,
      sell_price: item.sell_price || null,
      actual_qty_sold: item.actual_qty_sold || null,
      actual_revenue: item.actual_revenue || null,
      notes: item.notes || null,
      sort_order: item.sort_order ?? index,
    }))

    const { data: prepItems, error } = await supabase
      .from('event_prep_items')
      .insert(rows)
      .select()

    if (error) {
      logger.api.error('POST', `/api/admin/events/${eventId}/prep-items`, error as Error, { ...context, tenantId })
      captureException(error as Error, { ...context, tenantId })
      return NextResponse.json(
        { message: 'Failed to add prep items', error: error.message },
        { status: 500 }
      )
    }

    logger.info('Prep items added', { ...context, tenantId, eventId, count: prepItems?.length })
    return NextResponse.json(prepItems, { status: 201 })
  } catch (error: any) {
    logger.api.error('POST', `/api/admin/events/${eventId}/prep-items`, error, context)
    captureException(error, context)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/events/[id]/prep-items
 * Bulk update prep items
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = getTenantContextFromHeaders(request.headers)
  const { id: eventId } = await params
  logger.api.request('PATCH', `/api/admin/events/${eventId}/prep-items`, context)

  const isValidCsrf = await verifyCsrfToken(request)
  if (!isValidCsrf) {
    return NextResponse.json(
      { message: 'CSRF token missing or invalid' },
      { status: 403 }
    )
  }

  try {
    const supabase = await createServerAuthClient()
    const tenantId = await getAdminTenantId(request)

    // Verify event belongs to tenant
    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('tenant_id', tenantId)
      .single()

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    const body = await request.json()
    const { items } = body

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { message: 'Items array is required' },
        { status: 400 }
      )
    }

    const results = []
    for (const item of items) {
      if (!item.id) continue

      const allowedFields = [
        'item_name', 'category', 'planned_qty', 'planned_kg', 'planned_boxes',
        'cost_per_kg', 'sell_price', 'actual_qty_sold', 'actual_revenue', 'notes', 'sort_order'
      ]
      const updates: Record<string, any> = {}
      for (const field of allowedFields) {
        if (field in item) {
          updates[field] = item[field]
        }
      }

      const { data, error } = await supabase
        .from('event_prep_items')
        .update(updates)
        .eq('id', item.id)
        .eq('event_id', eventId)
        .select()
        .single()

      if (error) {
        logger.warn('Failed to update prep item', { ...context, itemId: item.id, error: error.message })
      } else if (data) {
        results.push(data)
      }
    }

    logger.info('Prep items updated', { ...context, tenantId, eventId, count: results.length })
    return NextResponse.json(results)
  } catch (error: any) {
    logger.api.error('PATCH', `/api/admin/events/${eventId}/prep-items`, error, context)
    captureException(error, context)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/events/[id]/prep-items
 * Delete prep items by IDs
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = getTenantContextFromHeaders(request.headers)
  const { id: eventId } = await params
  logger.api.request('DELETE', `/api/admin/events/${eventId}/prep-items`, context)

  const isValidCsrf = await verifyCsrfToken(request)
  if (!isValidCsrf) {
    return NextResponse.json(
      { message: 'CSRF token missing or invalid' },
      { status: 403 }
    )
  }

  try {
    const supabase = await createServerAuthClient()
    const tenantId = await getAdminTenantId(request)

    // Verify event belongs to tenant
    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('tenant_id', tenantId)
      .single()

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    const body = await request.json()
    const { item_ids } = body

    if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
      return NextResponse.json(
        { message: 'item_ids array is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('event_prep_items')
      .delete()
      .in('id', item_ids)
      .eq('event_id', eventId)

    if (error) {
      logger.api.error('DELETE', `/api/admin/events/${eventId}/prep-items`, error as Error, { ...context, tenantId })
      captureException(error as Error, { ...context, tenantId })
      return NextResponse.json(
        { message: 'Failed to delete prep items', error: error.message },
        { status: 500 }
      )
    }

    logger.info('Prep items deleted', { ...context, tenantId, eventId, count: item_ids.length })
    return NextResponse.json({ message: 'Prep items deleted' })
  } catch (error: any) {
    logger.api.error('DELETE', `/api/admin/events/${eventId}/prep-items`, error, context)
    captureException(error, context)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
