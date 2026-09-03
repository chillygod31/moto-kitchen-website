'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface CalendarEvent {
  id: string
  summary: string
  description?: string
  location?: string
  start: string
  end: string
  allDay: boolean
  colorId?: string
}

interface EventFormData {
  summary: string
  date: string
  startTime: string
  endTime: string
  location: string
  description: string
}

const EMPTY_FORM: EventFormData = {
  summary: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  description: '',
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function AdminCalendarPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [csrfToken, setCsrfToken] = useState('')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [formData, setFormData] = useState<EventFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [configError, setConfigError] = useState(false)

  // ─── Auth + initial fetch ────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const sessionRes = await fetch('/api/admin/session')
        if (!sessionRes.ok) { router.push('/admin/login'); return }
        const csrfRes = await fetch('/api/csrf')
        const csrfData = await csrfRes.json()
        setCsrfToken(csrfData.token)
        setLoading(false)
      } catch { router.push('/admin/login') }
    }
    init()
  }, [router])

  // ─── Fetch events when month changes ─────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    const start = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate()
    const end = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${lastDay}`
    try {
      const res = await fetch(`/api/admin/calendar?start=${start}&end=${end}`)
      if (!res.ok) {
        if (res.status === 503) { setConfigError(true); setEvents([]); return }
        throw new Error('Failed to fetch')
      }
      setConfigError(false)
      const data = await res.json()
      setEvents(data)
    } catch (err) { console.error('Error fetching calendar events:', err) }
  }, [currentYear, currentMonth])

  useEffect(() => { if (!loading) fetchEvents() }, [loading, fetchEvents])

  // ─── Calendar grid data ──────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(currentYear, currentMonth, 1)
    const lastOfMonth = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = lastOfMonth.getDate()
    let startDay = firstOfMonth.getDay() - 1
    if (startDay < 0) startDay = 6
    const days: { date: string; day: number; isCurrentMonth: boolean }[] = []
    const prevMonth = new Date(currentYear, currentMonth, 0)
    for (let i = startDay - 1; i >= 0; i--) {
      const d = prevMonth.getDate() - i
      const m = currentMonth === 0 ? 12 : currentMonth
      const y = currentMonth === 0 ? currentYear - 1 : currentYear
      days.push({ date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: false })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: true })
    }
    const remaining = 7 - (days.length % 7)
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const m = currentMonth + 2 > 12 ? 1 : currentMonth + 2
        const y = currentMonth + 2 > 12 ? currentYear + 1 : currentYear
        days.push({ date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: false })
      }
    }
    return days
  }, [currentYear, currentMonth])

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    events.forEach(event => {
      const dateStr = event.allDay ? event.start : event.start.split('T')[0]
      if (!map[dateStr]) map[dateStr] = []
      map[dateStr].push(event)
    })
    return map
  }, [events])

  const today = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }, [])

  const monthLabel = new Date(currentYear, currentMonth).toLocaleString('en-IE', { month: 'long' })

  // ─── Navigation ──────────────────────────────────────────────────────────
  const goToPrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else { setCurrentMonth(m => m - 1) }
    setSelectedDate(null)
  }
  const goToNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else { setCurrentMonth(m => m + 1) }
    setSelectedDate(null)
  }
  const goToToday = () => {
    const now = new Date()
    setCurrentYear(now.getFullYear())
    setCurrentMonth(now.getMonth())
    setSelectedDate(today)
  }

  const selectedDateEvents = selectedDate ? (eventsByDate[selectedDate] || []) : []

  const formatSelectedDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const formatTime = (dateTimeStr: string) => {
    if (!dateTimeStr.includes('T')) return 'All day'
    const d = new Date(dateTimeStr)
    return d.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  // ─── CRUD handlers ───────────────────────────────────────────────────────
  // The API replies with { message, error } naming what actually went wrong
  // (unauthorized, calendar not connected, a Google API refusal). Throwing a
  // fixed string here discarded that and left every failure looking alike.
  const errorMessageFrom = async (res: Response, fallback: string) => {
    try {
      const body = await res.json()
      return [body?.message, body?.error].filter(Boolean).join(' — ') || fallback
    } catch {
      return fallback
    }
  }

  const handleCreate = async () => {
    if (!formData.summary || !formData.date) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/admin/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({
          summary: formData.summary, date: formData.date,
          startTime: formData.startTime || undefined, endTime: formData.endTime || undefined,
          location: formData.location || undefined, description: formData.description || undefined,
        }),
      })
      if (!res.ok) throw new Error(await errorMessageFrom(res, 'Failed to create event'))
      setShowAddModal(false); setFormData(EMPTY_FORM); await fetchEvents()
    } catch (err: any) { setError(err.message) } finally { setSaving(false) }
  }

  const handleUpdate = async () => {
    if (!editingEvent || !formData.summary || !formData.date) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/admin/calendar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({
          eventId: editingEvent.id, summary: formData.summary, date: formData.date,
          startTime: formData.startTime || undefined, endTime: formData.endTime || undefined,
          location: formData.location || undefined, description: formData.description || undefined,
        }),
      })
      if (!res.ok) throw new Error(await errorMessageFrom(res, 'Failed to update event'))
      setShowEditModal(false); setEditingEvent(null); setFormData(EMPTY_FORM); await fetchEvents()
    } catch (err: any) { setError(err.message) } finally { setSaving(false) }
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm('Delete this calendar event?')) return
    try {
      const res = await fetch('/api/admin/calendar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ eventId }),
      })
      if (!res.ok) throw new Error(await errorMessageFrom(res, 'Failed to delete event'))
      await fetchEvents()
    } catch (err: any) { console.error('Error deleting event:', err); setError(err.message) }
  }

  const openAddModal = (date?: string) => {
    setFormData({ ...EMPTY_FORM, date: date || selectedDate || today })
    setError(''); setShowAddModal(true)
  }
  const openEditModal = (event: CalendarEvent) => {
    const dateStr = event.allDay ? event.start : event.start.split('T')[0]
    const startTime = event.allDay ? '' : event.start.split('T')[1]?.slice(0, 5) || ''
    const endTime = event.allDay ? '' : event.end.split('T')[1]?.slice(0, 5) || ''
    setEditingEvent(event)
    setFormData({ summary: event.summary, date: dateStr, startTime, endTime, location: event.location || '', description: event.description || '' })
    setError(''); setShowEditModal(true)
  }

  // ─── Shared form renderer ────────────────────────────────────────────────
  const renderEventForm = (isEdit: boolean) => (
    <div className="space-y-4">
      {error && (
        <div className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: '#FEF2F2', color: '#991B1B' }}>
          {error}
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6B5B55' }}>Title</label>
        <input type="text" value={formData.summary} onChange={(e) => setFormData(p => ({ ...p, summary: e.target.value }))}
          className="w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none"
          style={{ borderColor: '#E6D9C8', color: '#1F1F1F' }}
          onFocus={(e) => e.currentTarget.style.borderColor = '#C9653B'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#E6D9C8'}
          placeholder="e.g. Jane Smith - Wedding" autoFocus />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6B5B55' }}>Date</label>
        <input type="date" value={formData.date} onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))}
          className="w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none"
          style={{ borderColor: '#E6D9C8', color: '#1F1F1F' }}
          onFocus={(e) => e.currentTarget.style.borderColor = '#C9653B'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#E6D9C8'} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6B5B55' }}>Start</label>
          <input type="time" value={formData.startTime} onChange={(e) => setFormData(p => ({ ...p, startTime: e.target.value }))}
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none"
            style={{ borderColor: '#E6D9C8', color: '#1F1F1F' }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#C9653B'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#E6D9C8'} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6B5B55' }}>End</label>
          <input type="time" value={formData.endTime} onChange={(e) => setFormData(p => ({ ...p, endTime: e.target.value }))}
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none"
            style={{ borderColor: '#E6D9C8', color: '#1F1F1F' }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#C9653B'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#E6D9C8'} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6B5B55' }}>Location</label>
        <input type="text" value={formData.location} onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
          className="w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none"
          style={{ borderColor: '#E6D9C8', color: '#1F1F1F' }}
          onFocus={(e) => e.currentTarget.style.borderColor = '#C9653B'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#E6D9C8'}
          placeholder="e.g. Phoenix Park, Dublin" />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6B5B55' }}>Notes</label>
        <textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
          className="w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none resize-none"
          style={{ borderColor: '#E6D9C8', color: '#1F1F1F' }}
          onFocus={(e) => e.currentTarget.style.borderColor = '#C9653B'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#E6D9C8'}
          rows={3} placeholder="Additional details..." />
      </div>
    </div>
  )

  // ─── Detail panel content (shared between desktop & mobile) ──────────────
  const renderDetailPanel = () => (
    <>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-base font-bold" style={{ color: '#3A2A24' }}>
            {selectedDate && formatSelectedDate(selectedDate)}
          </h3>
          <p className="text-xs mt-1" style={{ color: '#6B5B55' }}>
            {selectedDateEvents.length === 0
              ? 'Nothing scheduled'
              : `${selectedDateEvents.length} event${selectedDateEvents.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={() => setSelectedDate(null)}
          className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
          style={{ color: '#6B5B55' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F0EB' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>

      {selectedDateEvents.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FAF6EF' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="4" width="16" height="14" rx="2" stroke="#C9653B" strokeWidth="1.5"/>
              <path d="M2 8h16M6 2v4M14 2v4" stroke="#C9653B" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-sm mb-4" style={{ color: '#6B5B55' }}>This day is free</p>
          <button onClick={() => openAddModal(selectedDate!)}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:shadow-md"
            style={{ backgroundColor: '#C9653B' }}>
            + Add Event
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {selectedDateEvents.map(event => (
            <div key={event.id} className="group rounded-lg p-3.5 transition-colors"
              style={{ backgroundColor: '#FAF6EF', borderLeft: '3px solid #C9653B' }}>
              <p className="text-sm font-semibold truncate" style={{ color: '#3A2A24' }}>{event.summary}</p>
              <div className="flex items-center gap-2 mt-1">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#6B5B55" strokeWidth="1.2"/><path d="M6 3v3l2 1.5" stroke="#6B5B55" strokeWidth="1.2" strokeLinecap="round"/></svg>
                <span className="text-xs" style={{ color: '#6B5B55' }}>
                  {event.allDay ? 'All day' : `${formatTime(event.start)} – ${formatTime(event.end)}`}
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 mt-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1C4.067 1 2.5 2.567 2.5 4.5 2.5 7.25 6 11 6 11s3.5-3.75 3.5-6.5C9.5 2.567 7.933 1 6 1z" stroke="#6B5B55" strokeWidth="1.2"/><circle cx="6" cy="4.5" r="1.25" stroke="#6B5B55" strokeWidth="1.2"/></svg>
                  <span className="text-xs truncate" style={{ color: '#6B5B55' }}>{event.location}</span>
                </div>
              )}
              {event.description && (
                <p className="text-xs mt-2 line-clamp-2" style={{ color: '#8B7B75' }}>{event.description}</p>
              )}
              <div className="flex gap-3 mt-2.5 pt-2" style={{ borderTop: '1px solid #E6D9C8' }}>
                <button onClick={() => openEditModal(event)}
                  className="text-xs font-medium transition-colors hover:underline" style={{ color: '#C9653B' }}>Edit</button>
                <button onClick={() => handleDelete(event.id)}
                  className="text-xs font-medium transition-colors hover:underline" style={{ color: '#991B1B' }}>Delete</button>
              </div>
            </div>
          ))}
          <button onClick={() => openAddModal(selectedDate!)}
            className="w-full mt-1 px-3 py-2.5 text-xs font-medium rounded-lg border border-dashed transition-colors"
            style={{ borderColor: '#E6D9C8', color: '#6B5B55' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FAF6EF'; e.currentTarget.style.borderColor = '#C9653B' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#E6D9C8' }}>
            + Add another event
          </button>
        </div>
      )}
    </>
  )

  // ─── Render ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ backgroundColor: '#FAFAF8' }}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 rounded w-48" style={{ backgroundColor: '#E6D9C8' }} />
            <div className="h-[500px] rounded-xl" style={{ backgroundColor: '#F5F0EB' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#FAFAF8', minHeight: 'calc(100vh - 90px)' }}>
      <div className="max-w-7xl mx-auto">

        {/* ─── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ fontFamily: 'var(--font-inter), sans-serif', color: '#3A2A24' }}>
              Calendar
            </h1>
            <p className="text-xs sm:text-sm mt-1 hidden sm:block" style={{ color: '#6B5B55' }}>
              Manage your schedule and availability
            </p>
          </div>
          <button onClick={() => openAddModal()}
            className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white rounded-lg transition-all hover:shadow-lg active:scale-[0.98]"
            style={{ backgroundColor: '#C9653B' }}>
            + Add Event
          </button>
        </div>

        {/* Config error / not connected banner */}
        {configError && (
          <div className="rounded-xl p-5 mb-8 border" style={{ backgroundColor: '#FFF8F0', borderColor: '#F0D5B8' }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFF0E0' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 11c-.55 0-1-.45-1-1V9c0-.55.45-1 1-1s1 .45 1 1v3c0 .55-.45 1-1 1zm1-8H9V4h2v1z" fill="#C9653B"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold mb-1" style={{ color: '#3A2A24' }}>Connect Google Calendar</h3>
                <p className="text-xs leading-relaxed mb-3" style={{ color: '#6B5B55' }}>
                  Link your Google account to sync events between the website and your phone.
                </p>
                <a href="/api/admin/calendar/oauth"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:shadow-md"
                  style={{ backgroundColor: '#C9653B' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M14 8.5V12a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2h3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M10 2h4v4M14 2L7 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Connect Account
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ─── Calendar Layout ─────────────────────────────────────── */}
        <div className="flex gap-6">

          {/* Calendar grid */}
          <div className="flex-1 min-w-0">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3 sm:mb-5">
              <div className="flex items-center gap-0.5 sm:gap-1">
                <button onClick={goToPrevMonth}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg transition-colors"
                  style={{ color: '#6B5B55' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F0EB'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <h2 className="text-base sm:text-xl font-bold min-w-[140px] sm:min-w-[200px] text-center" style={{ color: '#3A2A24' }}>
                  {monthLabel} <span className="font-normal" style={{ color: '#6B5B55' }}>{currentYear}</span>
                </h2>
                <button onClick={goToNextMonth}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg transition-colors"
                  style={{ color: '#6B5B55' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F0EB'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
              <button onClick={goToToday}
                className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider rounded-lg border transition-colors"
                style={{ borderColor: '#E6D9C8', color: '#6B5B55' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FAF6EF'; e.currentTarget.style.borderColor = '#C9653B'; e.currentTarget.style.color = '#C9653B' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#E6D9C8'; e.currentTarget.style.color = '#6B5B55' }}>
                Today
              </button>
            </div>

            {/* Grid */}
            <div className="rounded-xl overflow-hidden border" style={{ backgroundColor: 'white', borderColor: '#E6D9C8' }}>
              {/* Day headers */}
              <div className="grid grid-cols-7" style={{ backgroundColor: '#3A2A24' }}>
                {DAY_NAMES.map(day => (
                  <div key={day} className="px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-widest"
                    style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {calendarDays.map((cell, i) => {
                  const dayEvents = eventsByDate[cell.date] || []
                  const isToday = cell.date === today
                  const isSelected = cell.date === selectedDate
                  const hasEvents = dayEvents.length > 0

                  return (
                    <button key={i}
                      onClick={() => setSelectedDate(cell.date === selectedDate ? null : cell.date)}
                      className="relative text-left transition-all group aspect-square sm:aspect-auto"
                      style={{
                        minHeight: 'clamp(48px, 10vw, 100px)',
                        padding: 'clamp(4px, 1vw, 8px)',
                        borderBottom: '1px solid #F0EBE5',
                        borderRight: '1px solid #F0EBE5',
                        backgroundColor: isSelected ? '#FAF6EF' : !cell.isCurrentMonth ? '#FAFAF8' : 'white',
                        boxShadow: isSelected ? 'inset 0 0 0 2px #C9653B' : 'none',
                      }}>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 text-xs sm:text-sm rounded-full transition-colors"
                          style={{
                            backgroundColor: isToday ? '#C9653B' : 'transparent',
                            color: isToday ? 'white' : !cell.isCurrentMonth ? '#C4B8AE' : '#3A2A24',
                            fontWeight: isToday || isSelected ? 700 : 400,
                          }}>
                          {cell.day}
                        </span>
                        {hasEvents && (
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 sm:hidden" style={{ backgroundColor: '#C9653B' }} />
                        )}
                      </div>

                      {/* Event labels - hidden on very small screens, show dots instead */}
                      <div className="mt-0.5 sm:mt-1 space-y-0.5 hidden sm:block overflow-hidden">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div key={ev.id}
                            className="text-[10px] md:text-[11px] leading-tight truncate px-1 md:px-1.5 py-[2px] md:py-[3px] rounded-md font-medium"
                            style={{ backgroundColor: '#C9653B15', color: '#C9653B' }}>
                            {ev.summary}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[10px] px-1 font-medium" style={{ color: '#8B7B75' }}>
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>

                      {/* Dot indicators for small screens */}
                      {hasEvents && (
                        <div className="flex gap-0.5 mt-1 sm:hidden justify-center">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <span key={ev.id} className="w-1 h-1 rounded-full" style={{ backgroundColor: '#C9653B' }} />
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ─── Detail Panel (desktop) ──────────────────────────────── */}
          {selectedDate && (
            <div className="w-[320px] flex-shrink-0 hidden lg:block">
              <div className="rounded-xl border p-5 sticky top-[110px]"
                style={{ backgroundColor: 'white', borderColor: '#E6D9C8' }}>
                {renderDetailPanel()}
              </div>
            </div>
          )}
        </div>

        {/* ─── Mobile detail panel ──────────────────────────────────── */}
        {selectedDate && (
          <div className="mt-4 lg:hidden">
            <div className="rounded-xl border p-4" style={{ backgroundColor: 'white', borderColor: '#E6D9C8' }}>
              {renderDetailPanel()}
            </div>
          </div>
        )}

        {/* ─── Add Event Modal ──────────────────────────────────────── */}
        {showAddModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(58, 42, 36, 0.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => { setShowAddModal(false); setFormData(EMPTY_FORM); setError('') }}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              style={{ animation: 'modalIn 0.2s ease-out' }}>
              <div className="px-6 py-4" style={{ backgroundColor: '#3A2A24' }}>
                <h2 className="text-base font-bold text-white">New Event</h2>
              </div>
              <div className="p-6">
                {renderEventForm(false)}
              </div>
              <div className="px-6 py-4 flex justify-end gap-3" style={{ backgroundColor: '#FAFAF8', borderTop: '1px solid #F0EBE5' }}>
                <button onClick={() => { setShowAddModal(false); setFormData(EMPTY_FORM); setError('') }}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{ color: '#6B5B55' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F0EB'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  Cancel
                </button>
                <button onClick={handleCreate}
                  disabled={saving || !formData.summary || !formData.date}
                  className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-all disabled:opacity-50 hover:shadow-md"
                  style={{ backgroundColor: '#C9653B' }}>
                  {saving ? 'Adding...' : 'Add to Calendar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Edit Event Modal ─────────────────────────────────────── */}
        {showEditModal && editingEvent && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(58, 42, 36, 0.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => { setShowEditModal(false); setEditingEvent(null); setFormData(EMPTY_FORM); setError('') }}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              style={{ animation: 'modalIn 0.2s ease-out' }}>
              <div className="px-6 py-4" style={{ backgroundColor: '#3A2A24' }}>
                <h2 className="text-base font-bold text-white">Edit Event</h2>
              </div>
              <div className="p-6">
                {renderEventForm(true)}
              </div>
              <div className="px-6 py-4 flex justify-end gap-3" style={{ backgroundColor: '#FAFAF8', borderTop: '1px solid #F0EBE5' }}>
                <button onClick={() => { setShowEditModal(false); setEditingEvent(null); setFormData(EMPTY_FORM); setError('') }}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{ color: '#6B5B55' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F0EB'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  Cancel
                </button>
                <button onClick={handleUpdate}
                  disabled={saving || !formData.summary || !formData.date}
                  className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-all disabled:opacity-50 hover:shadow-md"
                  style={{ backgroundColor: '#C9653B' }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <style jsx global>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
