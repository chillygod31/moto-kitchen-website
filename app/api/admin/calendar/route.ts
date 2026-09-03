import { NextRequest, NextResponse } from 'next/server'
import { getAdminTenantId } from '@/lib/auth/server-admin'
import { verifyCsrfToken } from '@/lib/csrf'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '@/lib/google-calendar'

/**
 * GET /api/admin/calendar?start=2026-03-01&end=2026-03-31
 * Fetch Google Calendar events for a date range
 */
export async function GET(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('GET', '/api/admin/calendar', context)

  try {
    await getAdminTenantId(request)

    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    if (!start || !end) {
      return NextResponse.json(
        { message: 'Missing start or end query parameters' },
        { status: 400 }
      )
    }

    const events = await getCalendarEvents(start, end)

    return NextResponse.json(events)
  } catch (error: any) {
    logger.api.error('GET', '/api/admin/calendar', error, context)
    captureException(error, context)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    if (error.message?.includes('Missing Google Calendar') || error.message?.includes('not authorized')) {
      return NextResponse.json(
        { message: 'Google Calendar not configured', error: error.message },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { message: 'Failed to fetch calendar events', error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/calendar
 * Create a new calendar event
 */
export async function POST(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('POST', '/api/admin/calendar', context)

  try {
    await getAdminTenantId(request)
    verifyCsrfToken(request)

    const body = await request.json()
    const { summary, date, endDate, startTime, endTime, location, description } = body

    if (!summary || !date) {
      return NextResponse.json(
        { message: 'Summary and date are required' },
        { status: 400 }
      )
    }

    const event = await createCalendarEvent({
      summary,
      date,
      endDate,
      startTime,
      endTime,
      location,
      description,
    })

    logger.info('Calendar event created', { ...context, eventId: event.id })
    return NextResponse.json(event, { status: 201 })
  } catch (error: any) {
    logger.api.error('POST', '/api/admin/calendar', error, context)
    captureException(error, context)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { message: 'Failed to create calendar event', error: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/calendar
 * Update an existing calendar event
 */
export async function PATCH(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('PATCH', '/api/admin/calendar', context)

  try {
    await getAdminTenantId(request)
    verifyCsrfToken(request)

    const body = await request.json()
    const { eventId, ...updates } = body

    if (!eventId) {
      return NextResponse.json(
        { message: 'eventId is required' },
        { status: 400 }
      )
    }

    const event = await updateCalendarEvent(eventId, updates)

    logger.info('Calendar event updated', { ...context, eventId })
    return NextResponse.json(event)
  } catch (error: any) {
    logger.api.error('PATCH', '/api/admin/calendar', error, context)
    captureException(error, context)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { message: 'Failed to update calendar event', error: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/calendar
 * Delete a calendar event
 */
export async function DELETE(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('DELETE', '/api/admin/calendar', context)

  try {
    await getAdminTenantId(request)
    verifyCsrfToken(request)

    const body = await request.json()
    const { eventId } = body

    if (!eventId) {
      return NextResponse.json(
        { message: 'eventId is required' },
        { status: 400 }
      )
    }

    await deleteCalendarEvent(eventId)

    logger.info('Calendar event deleted', { ...context, eventId })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.api.error('DELETE', '/api/admin/calendar', error, context)
    captureException(error, context)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { message: 'Failed to delete calendar event', error: error.message },
      { status: 500 }
    )
  }
}
