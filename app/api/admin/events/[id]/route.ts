import { NextRequest, NextResponse } from 'next/server'
import { createServerAuthClient } from '@/lib/supabase/server-auth'
import { getAdminTenantId } from '@/lib/auth/server-admin'
import { verifyCsrfToken } from '@/lib/csrf'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'

/**
 * GET /api/admin/events/[id]
 * Get a single event with its prep items
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = getTenantContextFromHeaders(request.headers)
  const { id } = await params
  logger.api.request('GET', `/api/admin/events/${id}`, context)

  try {
    const supabase = await createServerAuthClient()
    const tenantId = await getAdminTenantId(request)

    const { data: event, error } = await supabase
      .from('events')
      .select('*, event_prep_items(*)')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error || !event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      )
    }

    // Sort prep items by sort_order
    if (event.event_prep_items) {
      event.event_prep_items.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
    }

    return NextResponse.json(event)
  } catch (error: any) {
    logger.api.error('GET', `/api/admin/events/${id}`, error, context)
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
 * PATCH /api/admin/events/[id]
 * Update an event
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = getTenantContextFromHeaders(request.headers)
  const { id } = await params
  logger.api.request('PATCH', `/api/admin/events/${id}`, context)

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
    const body = await request.json()

    // Verify event belongs to tenant
    const { data: existing } = await supabase
      .from('events')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (!existing) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    const allowedFields = [
      'name', 'date', 'start_time', 'end_time', 'event_type',
      'expected_guests', 'location', 'notes', 'pack_level', 'status'
    ]
    const updates: Record<string, any> = {}
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    const { data: event, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      logger.api.error('PATCH', `/api/admin/events/${id}`, error as Error, { ...context, tenantId })
      captureException(error as Error, { ...context, tenantId })
      return NextResponse.json(
        { message: 'Failed to update event', error: error.message },
        { status: 500 }
      )
    }

    logger.info('Event updated', { ...context, tenantId, eventId: id })
    return NextResponse.json(event)
  } catch (error: any) {
    logger.api.error('PATCH', `/api/admin/events/${id}`, error, context)
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
 * DELETE /api/admin/events/[id]
 * Delete an event and its prep items (cascade)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = getTenantContextFromHeaders(request.headers)
  const { id } = await params
  logger.api.request('DELETE', `/api/admin/events/${id}`, context)

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

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      logger.api.error('DELETE', `/api/admin/events/${id}`, error as Error, { ...context, tenantId })
      captureException(error as Error, { ...context, tenantId })
      return NextResponse.json(
        { message: 'Failed to delete event', error: error.message },
        { status: 500 }
      )
    }

    logger.info('Event deleted', { ...context, tenantId, eventId: id })
    return NextResponse.json({ message: 'Event deleted' })
  } catch (error: any) {
    logger.api.error('DELETE', `/api/admin/events/${id}`, error, context)
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
