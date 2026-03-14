import { NextRequest, NextResponse } from 'next/server'
import { getAdminTenantId } from '@/lib/auth/server-admin'
import { verifyCsrfToken } from '@/lib/csrf'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'
import { createCalendarEvent } from '@/lib/google-calendar'

/**
 * POST /api/admin/calendar/from-quote
 * Create a Google Calendar event from quote data
 */
export async function POST(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('POST', '/api/admin/calendar/from-quote', context)

  try {
    await getAdminTenantId(request)
    verifyCsrfToken(request)

    const body = await request.json()
    const { summary, date, startTime, endTime, location, description } = body

    if (!summary || !date) {
      return NextResponse.json(
        { message: 'Summary and date are required' },
        { status: 400 }
      )
    }

    const event = await createCalendarEvent({
      summary,
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      location: location || undefined,
      description: description || undefined,
    })

    logger.info('Calendar event created from quote', { ...context, eventId: event.id })
    return NextResponse.json(event, { status: 201 })
  } catch (error: any) {
    logger.api.error('POST', '/api/admin/calendar/from-quote', error, context)
    captureException(error, context)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { message: 'Failed to create calendar event from quote', error: error.message },
      { status: 500 }
    )
  }
}
