import { NextRequest, NextResponse } from 'next/server'
import { createServerAuthClient } from '@/lib/supabase/server-auth'
import { getAdminTenantId } from '@/lib/auth/server-admin'
import { verifyCsrfToken } from '@/lib/csrf'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'

/**
 * GET /api/admin/events
 * List all events for the tenant
 */
export async function GET(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('GET', '/api/admin/events', context)

  try {
    const supabase = await createServerAuthClient()
    const tenantId = await getAdminTenantId(request)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('events')
      .select('*, event_prep_items(count)')
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: events, error } = await query

    if (error) {
      logger.api.error('GET', '/api/admin/events', error as Error, { ...context, tenantId })
      captureException(error as Error, { ...context, tenantId })
      return NextResponse.json(
        { message: 'Failed to fetch events', error: error.message },
        { status: 500 }
      )
    }

    logger.info('Events fetched successfully', { ...context, tenantId, count: events?.length || 0 })
    return NextResponse.json(events || [])
  } catch (error: any) {
    logger.api.error('GET', '/api/admin/events', error, context)
    captureException(error, context)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { message: 'Unauthorized', error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/events
 * Create a new event
 */
export async function POST(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('POST', '/api/admin/events', context)

  const isValidCsrf = await verifyCsrfToken(request)
  if (!isValidCsrf) {
    logger.warn('CSRF token missing or invalid', { ...context, path: '/api/admin/events' })
    return NextResponse.json(
      { message: 'CSRF token missing or invalid' },
      { status: 403 }
    )
  }

  try {
    const supabase = await createServerAuthClient()
    const tenantId = await getAdminTenantId(request)
    const body = await request.json()

    const { name, date, start_time, end_time, event_type, expected_guests, location, notes, pack_level } = body

    if (!name || !date) {
      return NextResponse.json(
        { message: 'Name and date are required' },
        { status: 400 }
      )
    }

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        tenant_id: tenantId,
        name,
        date,
        start_time: start_time || null,
        end_time: end_time || null,
        event_type: event_type || 'festival',
        expected_guests: expected_guests || null,
        location: location || null,
        notes: notes || null,
        pack_level: pack_level || 'pack1',
      })
      .select()
      .single()

    if (error) {
      logger.api.error('POST', '/api/admin/events', error as Error, { ...context, tenantId })
      captureException(error as Error, { ...context, tenantId })
      return NextResponse.json(
        { message: 'Failed to create event', error: error.message },
        { status: 500 }
      )
    }

    logger.info('Event created successfully', { ...context, tenantId, eventId: event?.id })
    return NextResponse.json(event, { status: 201 })
  } catch (error: any) {
    logger.api.error('POST', '/api/admin/events', error, context)
    captureException(error, context)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { message: 'Unauthorized', error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
