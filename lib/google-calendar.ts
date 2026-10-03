import { google, calendar_v3 } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/calendar']

// The business and its calendar (contact@motokitchen.nl) are both in Amsterdam,
// so every timed event is written, read and shown in this zone. Reading in the
// same zone it is written in is what makes an edit round-trip: the form shows
// Amsterdam wall-clock times, so saving them as Amsterdam leaves the event where
// it was. Writing in Europe/Dublin instead moved every edited event an hour later.
// Existing events are untouched by this; they keep the instant they were saved at.
const EVENT_TIME_ZONE = 'Europe/Amsterdam'

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/calendar/oauth/callback`

  if (!clientId || !clientSecret) {
    throw new Error('Missing Google Calendar environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)')
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
  if (refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken })
  }

  return oauth2Client
}

export function getAuthUrl() {
  const oauth2Client = getOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  })
}

export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

function getCalendarId() {
  return process.env.GOOGLE_CALENDAR_ID || 'primary'
}

function getCalendar() {
  const auth = getOAuth2Client()
  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    throw new Error('Google Calendar not authorized. Visit /admin/calendar to connect your Google account.')
  }
  return google.calendar({ version: 'v3', auth })
}

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  location?: string
  start: string // ISO date or datetime
  end: string
  allDay: boolean
  colorId?: string
}

function formatEvent(event: calendar_v3.Schema$Event): CalendarEvent {
  const isAllDay = !!event.start?.date
  return {
    id: event.id || '',
    summary: event.summary || '(No title)',
    description: event.description || undefined,
    location: event.location || undefined,
    start: isAllDay ? event.start!.date! : event.start?.dateTime || '',
    end: isAllDay ? event.end!.date! : event.end?.dateTime || '',
    allDay: isAllDay,
    colorId: event.colorId || undefined,
  }
}

export async function getCalendarEvents(
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> {
  const calendar = getCalendar()
  const calendarId = getCalendarId()

  // The range arrives as plain dates. Read as UTC midnight they begin an hour or
  // two into the Amsterdam day, so an event just after midnight on the 1st fell
  // outside the window and never appeared. Pad a day either side; the page files
  // each event under its own date, so the extra margin only fills the grid's
  // neighbouring-month cells correctly.
  const rangeStart = new Date(startDate)
  rangeStart.setUTCDate(rangeStart.getUTCDate() - 1)
  const rangeEnd = new Date(endDate)
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 1)
  rangeEnd.setUTCHours(23, 59, 59, 999)

  const response = await calendar.events.list({
    calendarId,
    timeMin: rangeStart.toISOString(),
    timeMax: rangeEnd.toISOString(),
    // Ask for Amsterdam explicitly rather than relying on the calendar's own
    // setting, so the dates the page groups by are always Amsterdam dates.
    timeZone: EVENT_TIME_ZONE,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  })

  return (response.data.items || []).map(formatEvent)
}

export async function createCalendarEvent(params: {
  summary: string
  date: string
  endDate?: string
  startTime?: string
  endTime?: string
  location?: string
  description?: string
}): Promise<CalendarEvent> {
  const calendar = getCalendar()
  const calendarId = getCalendarId()

  let start: calendar_v3.Schema$EventDateTime
  let end: calendar_v3.Schema$EventDateTime

  // An event may finish on a later day than it starts — a booking running past
  // midnight, or a multi-day job. Without endDate the finish was pinned to the
  // start date, so those ranges ended before they began and Google refused them.
  const finishDate = params.endDate || params.date

  if (params.startTime && params.endTime) {
    start = { dateTime: `${params.date}T${params.startTime}:00`, timeZone: EVENT_TIME_ZONE }
    end = { dateTime: `${finishDate}T${params.endTime}:00`, timeZone: EVENT_TIME_ZONE }
  } else {
    start = { date: params.date }
    // Google treats an all-day end as exclusive, so advance a day to make the
    // date picked the last one the event actually covers.
    const endExclusive = new Date(finishDate)
    endExclusive.setDate(endExclusive.getDate() + 1)
    end = { date: endExclusive.toISOString().split('T')[0] }
  }

  const response = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: params.summary,
      description: params.description,
      location: params.location,
      start,
      end,
    },
  })

  return formatEvent(response.data)
}

export async function updateCalendarEvent(
  eventId: string,
  updates: {
    summary?: string
    date?: string
    endDate?: string
    startTime?: string
    endTime?: string
    location?: string
    description?: string
  }
): Promise<CalendarEvent> {
  const calendar = getCalendar()
  const calendarId = getCalendarId()

  const existing = await calendar.events.get({ calendarId, eventId })
  const body: calendar_v3.Schema$Event = { ...existing.data }

  if (updates.summary !== undefined) body.summary = updates.summary
  if (updates.description !== undefined) body.description = updates.description
  if (updates.location !== undefined) body.location = updates.location

  if (updates.date) {
    const finishDate = updates.endDate || updates.date

    if (updates.startTime && updates.endTime) {
      body.start = { dateTime: `${updates.date}T${updates.startTime}:00`, timeZone: EVENT_TIME_ZONE }
      body.end = { dateTime: `${finishDate}T${updates.endTime}:00`, timeZone: EVENT_TIME_ZONE }
    } else {
      body.start = { date: updates.date }
      const endExclusive = new Date(finishDate)
      endExclusive.setDate(endExclusive.getDate() + 1)
      body.end = { date: endExclusive.toISOString().split('T')[0] }
    }
  }

  const response = await calendar.events.update({
    calendarId,
    eventId,
    requestBody: body,
  })

  return formatEvent(response.data)
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const calendar = getCalendar()
  const calendarId = getCalendarId()

  await calendar.events.delete({ calendarId, eventId })
}
