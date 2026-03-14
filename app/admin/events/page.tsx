'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  PACK_TEMPLATES,
  PURCHASE_UNITS,
  DEFAULT_PREP_ITEMS,
  calculateRawKg,
  calculateBoxes,
} from '@/lib/event-constants'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Event {
  id: string
  name: string
  date: string
  start_time: string | null
  end_time: string | null
  event_type: 'private' | 'festival' | 'market' | 'corporate'
  expected_guests: number | null
  location: string | null
  notes: string | null
  pack_level: 'pack1' | 'pack2' | 'custom'
  status: 'planning' | 'completed'
  created_at: string
  updated_at: string
  event_prep_items?: PrepItem[]
}

interface PrepItem {
  id: string
  event_id: string
  item_name: string
  category: string | null
  planned_qty: number
  planned_kg: number | null
  planned_boxes: number | null
  cost_per_kg: number | null
  sell_price: number | null
  actual_qty_sold: number | null
  actual_revenue: number | null
  notes: string | null
  sort_order: number
  created_at: string
}

interface LocalPrepItem {
  id?: string
  item_name: string
  category: string | null
  planned_qty: number
  planned_kg: number | null
  planned_boxes: number | null
  cost_per_kg: number | null
  sell_price: number | null
  actual_qty_sold: number | null
  actual_revenue: number | null
  notes: string | null
  sort_order: number
}

interface ItemDefault {
  id?: string
  item_name: string
  category: string | null
  cost_per_kg: number | null
  cost_per_piece: number | null
  default_sell_price: number | null
  unit: 'kg' | 'piece' | 'box'
}

type ViewMode = 'list' | 'detail'
type FilterTab = 'all' | 'planning' | 'completed'
type PrepTab = 'planning' | 'actuals'

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminEventsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [csrfToken, setCsrfToken] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Prep sheet state
  const [prepItems, setPrepItems] = useState<LocalPrepItem[]>([])
  const [prepTab, setPrepTab] = useState<PrepTab>('planning')
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [showShoppingList, setShowShoppingList] = useState(false)
  const [showCsvImport, setShowCsvImport] = useState(false)
  const [showCopyFromEvent, setShowCopyFromEvent] = useState(false)
  const [showDefaultsModal, setShowDefaultsModal] = useState(false)

  // Item defaults
  const [itemDefaults, setItemDefaults] = useState<ItemDefault[]>([])
  const [editingDefaults, setEditingDefaults] = useState<ItemDefault[]>([])

  // Create/edit event form
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    start_time: '',
    end_time: '',
    event_type: 'festival' as Event['event_type'],
    expected_guests: '',
    location: '',
    notes: '',
    pack_level: 'pack1' as Event['pack_level'],
  })

  // ─── Auth & Fetch ─────────────────────────────────────────────────────────

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  const checkAuthAndFetch = async () => {
    try {
      const response = await fetch('/api/admin/session')
      if (!response.ok) {
        router.push('/admin/login')
        return
      }
      const csrfResponse = await fetch('/api/csrf')
      if (csrfResponse.ok) {
        const { csrfToken } = await csrfResponse.json()
        setCsrfToken(csrfToken)
      }
      await Promise.all([fetchEvents(), fetchItemDefaults()])
    } catch {
      router.push('/admin/login')
    }
  }

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/events')
      if (response.ok) {
        const data = await response.json()
        setEvents(data || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchItemDefaults = async () => {
    try {
      const response = await fetch('/api/admin/events/item-defaults')
      if (response.ok) {
        const data = await response.json()
        setItemDefaults(data || [])
      }
    } catch (error) {
      console.error('Error fetching item defaults:', error)
    }
  }

  const fetchEventDetail = async (eventId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/events/${eventId}`)
      if (response.ok) {
        const event = await response.json()
        setSelectedEvent(event)
        setPrepItems(
          (event.event_prep_items || []).map((item: PrepItem) => ({
            id: item.id,
            item_name: item.item_name,
            category: item.category,
            planned_qty: item.planned_qty,
            planned_kg: item.planned_kg,
            planned_boxes: item.planned_boxes,
            cost_per_kg: item.cost_per_kg,
            sell_price: item.sell_price,
            actual_qty_sold: item.actual_qty_sold,
            actual_revenue: item.actual_revenue,
            notes: item.notes,
            sort_order: item.sort_order,
          }))
        )
        setViewMode('detail')
      }
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setLoading(false)
    }
  }

  // ─── Filtered events ─────────────────────────────────────────────────────

  const filteredEvents = useMemo(() => {
    if (filterTab === 'all') return events
    return events.filter(e => e.status === filterTab)
  }, [events, filterTab])

  // ─── Create Event ─────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormData({
      name: '',
      date: '',
      start_time: '',
      end_time: '',
      event_type: 'festival',
      expected_guests: '',
      location: '',
      notes: '',
      pack_level: 'pack1',
    })
  }

  const getDefaultCost = (itemName: string): { cost_per_kg: number | null; sell_price: number | null } => {
    const def = itemDefaults.find(d => d.item_name.toLowerCase() === itemName.toLowerCase())
    if (def) {
      return {
        cost_per_kg: def.cost_per_kg || def.cost_per_piece,
        sell_price: def.default_sell_price,
      }
    }
    const hardcoded = DEFAULT_PREP_ITEMS.find(d => d.item_name.toLowerCase() === itemName.toLowerCase())
    return {
      cost_per_kg: hardcoded?.cost_per_kg || null,
      sell_price: hardcoded?.sell_price || null,
    }
  }

  const handleCreateEvent = async () => {
    if (!formData.name || !formData.date) {
      setError('Name and date are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({
          ...formData,
          expected_guests: formData.expected_guests ? parseInt(formData.expected_guests) : null,
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
        }),
      })
      if (response.ok) {
        const newEvent = await response.json()
        setShowCreateModal(false)
        resetForm()
        await fetchEvents()
        await addDefaultPrepItems(newEvent.id, formData.pack_level)
        await fetchEventDetail(newEvent.id)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to create event')
      }
    } catch {
      setError('Failed to create event')
    } finally {
      setSaving(false)
    }
  }

  const addDefaultPrepItems = async (eventId: string, packLevel: string) => {
    const items = DEFAULT_PREP_ITEMS.map((item, index) => {
      const defaults = getDefaultCost(item.item_name)
      let plannedKg: number | null = null

      if (packLevel !== 'custom') {
        const template = PACK_TEMPLATES[packLevel]
        if (template) {
          const templateKey = Object.keys(template).find(k =>
            item.item_name.toLowerCase() === k.toLowerCase()
          )
          if (templateKey) {
            const range = template[templateKey]
            plannedKg = Math.round((range.min + range.max) / 2)
          }
        }
      }

      return {
        item_name: item.item_name,
        category: item.category,
        planned_qty: 0,
        planned_kg: plannedKg,
        planned_boxes: null as number | null,
        cost_per_kg: defaults.cost_per_kg,
        sell_price: defaults.sell_price,
        sort_order: index,
      }
    })

    items.forEach(item => {
      if (item.planned_kg) {
        const boxes = calculateBoxes(item.item_name, item.planned_kg)
        if (boxes) item.planned_boxes = boxes
      }
    })

    try {
      await fetch(`/api/admin/events/${eventId}/prep-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ items }),
      })
    } catch (error) {
      console.error('Error adding default prep items:', error)
    }
  }

  // ─── Update Event ─────────────────────────────────────────────────────────

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/events/${selectedEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({
          ...formData,
          expected_guests: formData.expected_guests ? parseInt(formData.expected_guests) : null,
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
        }),
      })
      if (response.ok) {
        setShowEditModal(false)
        await fetchEventDetail(selectedEvent.id)
        await fetchEvents()
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to update event')
      }
    } catch {
      setError('Failed to update event')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!selectedEvent) return
    const newStatus = selectedEvent.status === 'planning' ? 'completed' : 'planning'
    try {
      await fetch(`/api/admin/events/${selectedEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ status: newStatus }),
      })
      await fetchEventDetail(selectedEvent.id)
      await fetchEvents()
    } catch (error) {
      console.error('Error toggling status:', error)
    }
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent || !confirm('Delete this event? This cannot be undone.')) return
    try {
      await fetch(`/api/admin/events/${selectedEvent.id}`, {
        method: 'DELETE',
        headers: { 'x-csrf-token': csrfToken },
      })
      setViewMode('list')
      setSelectedEvent(null)
      await fetchEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  // ─── Prep Items ───────────────────────────────────────────────────────────

  const handlePrepItemChange = (index: number, field: keyof LocalPrepItem, value: any) => {
    setPrepItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }

      if (field === 'planned_qty') {
        const rawKg = calculateRawKg(updated[index].item_name, Number(value) || 0)
        if (rawKg !== null) {
          updated[index].planned_kg = rawKg
        }
      }

      if (field === 'planned_kg' || field === 'planned_qty') {
        const kg = updated[index].planned_kg
        if (kg) {
          const boxes = calculateBoxes(updated[index].item_name, kg)
          if (boxes !== null) {
            updated[index].planned_boxes = boxes
          }
        }
      }

      return updated
    })
  }

  const handleAddPrepItem = () => {
    setPrepItems(prev => [
      ...prev,
      {
        item_name: '',
        category: null,
        planned_qty: 0,
        planned_kg: null,
        planned_boxes: null,
        cost_per_kg: null,
        sell_price: null,
        actual_qty_sold: null,
        actual_revenue: null,
        notes: null,
        sort_order: prev.length,
      },
    ])
  }

  const handleRemovePrepItem = (index: number) => {
    setPrepItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleSavePrepItems = async () => {
    if (!selectedEvent) return
    setSaving(true)
    try {
      const existing = prepItems.filter(item => item.id)
      const newItems = prepItems.filter(item => !item.id && item.item_name)

      if (existing.length > 0) {
        await fetch(`/api/admin/events/${selectedEvent.id}/prep-items`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
          body: JSON.stringify({ items: existing }),
        })
      }

      if (newItems.length > 0) {
        await fetch(`/api/admin/events/${selectedEvent.id}/prep-items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
          body: JSON.stringify({ items: newItems }),
        })
      }

      await fetchEventDetail(selectedEvent.id)
    } catch (error) {
      console.error('Error saving prep items:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePrepItem = async (itemId: string, index: number) => {
    if (!selectedEvent) return
    if (itemId) {
      try {
        await fetch(`/api/admin/events/${selectedEvent.id}/prep-items`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
          body: JSON.stringify({ item_ids: [itemId] }),
        })
      } catch (error) {
        console.error('Error deleting prep item:', error)
      }
    }
    handleRemovePrepItem(index)
  }

  const handleResetAllPrepItems = async () => {
    if (!selectedEvent || !confirm('Remove all prep items from this event?')) return
    const existingIds = prepItems.filter(item => item.id).map(item => item.id!)
    if (existingIds.length > 0) {
      try {
        await fetch(`/api/admin/events/${selectedEvent.id}/prep-items`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
          body: JSON.stringify({ item_ids: existingIds }),
        })
      } catch (error) {
        console.error('Error deleting all prep items:', error)
      }
    }
    setPrepItems([])
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const sortedPrepItems = useMemo(() => {
    if (!sortField) return prepItems
    const sorted = [...prepItems]
    sorted.sort((a, b) => {
      let aVal: any = (a as any)[sortField]
      let bVal: any = (b as any)[sortField]

      // Handle computed fields
      if (sortField === 'est_cost') {
        aVal = (a.cost_per_kg && a.planned_kg) ? a.cost_per_kg * a.planned_kg : 0
        bVal = (b.cost_per_kg && b.planned_kg) ? b.cost_per_kg * b.planned_kg : 0
      } else if (sortField === 'est_revenue') {
        aVal = (a.sell_price && a.planned_qty) ? a.sell_price * a.planned_qty : 0
        bVal = (b.sell_price && b.planned_qty) ? b.sell_price * b.planned_qty : 0
      } else if (sortField === 'difference') {
        aVal = (a.actual_qty_sold || 0) - (a.planned_qty || 0)
        bVal = (b.actual_qty_sold || 0) - (b.planned_qty || 0)
      }

      // Nulls/undefined go to bottom
      if (aVal == null) aVal = sortDir === 'asc' ? Infinity : -Infinity
      if (bVal == null) bVal = sortDir === 'asc' ? Infinity : -Infinity

      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    })
    return sorted
  }, [prepItems, sortField, sortDir])

  // ─── Pack Level Change ────────────────────────────────────────────────────

  const handlePackLevelChange = async (packLevel: 'pack1' | 'pack2' | 'custom') => {
    if (!selectedEvent) return

    // Update local state immediately so the tab highlights
    setSelectedEvent(prev => prev ? { ...prev, pack_level: packLevel } : prev)

    await fetch(`/api/admin/events/${selectedEvent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify({ pack_level: packLevel }),
    })

    // Also update the events list
    setEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, pack_level: packLevel } : e))

    if (packLevel === 'custom') return

    const template = PACK_TEMPLATES[packLevel]
    if (!template) return

    setPrepItems(prev =>
      prev.map(item => {
        // Only exact match — template "Mshikaki" applies to row "Mshikaki" only, not "Mshikaki plate"
        const key = item.item_name.toLowerCase()
        const templateKey = Object.keys(template).find(k => key === k.toLowerCase())
        if (!templateKey) return item

        const range = template[templateKey]
        const kg = Math.round((range.min + range.max) / 2)
        const boxes = calculateBoxes(item.item_name, kg)

        return { ...item, planned_kg: kg, planned_boxes: boxes }
      })
    )
  }

  // ─── Item Defaults ────────────────────────────────────────────────────────

  const openDefaultsModal = () => {
    // Pre-populate with existing defaults, plus any missing standard items
    const existing = [...itemDefaults]
    const standardItems = DEFAULT_PREP_ITEMS.filter(
      di => !existing.find(e => e.item_name.toLowerCase() === di.item_name.toLowerCase())
    )

    const merged: ItemDefault[] = [
      ...existing.map(d => ({
        id: d.id,
        item_name: d.item_name,
        category: d.category,
        cost_per_kg: d.cost_per_kg,
        cost_per_piece: d.cost_per_piece,
        default_sell_price: d.default_sell_price,
        unit: d.unit,
      })),
      ...standardItems.map(d => ({
        item_name: d.item_name,
        category: d.category,
        cost_per_kg: null,
        cost_per_piece: null,
        default_sell_price: d.sell_price,
        unit: 'kg' as const,
      })),
    ]

    setEditingDefaults(merged)
    setShowDefaultsModal(true)
  }

  const handleSaveDefaults = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/events/item-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ items: editingDefaults.filter(d => d.item_name) }),
      })
      if (response.ok) {
        await fetchItemDefaults()
        setShowDefaultsModal(false)
      }
    } catch (error) {
      console.error('Error saving defaults:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDefaultChange = (index: number, field: keyof ItemDefault, value: any) => {
    setEditingDefaults(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleAddDefault = () => {
    setEditingDefaults(prev => [
      ...prev,
      { item_name: '', category: null, cost_per_kg: null, cost_per_piece: null, default_sell_price: null, unit: 'kg' as const },
    ])
  }

  // ─── SumUp CSV Import ────────────────────────────────────────────────────

  const handleCsvImport = (csvText: string) => {
    try {
      const lines = csvText.split('\n').filter(l => l.trim())
      if (lines.length < 2) return

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const nameIdx = headers.findIndex(h => h.toLowerCase().includes('item name') || h.toLowerCase() === 'item')
      const qtyIdx = headers.findIndex(h => h.toLowerCase().includes('quantity') || h.toLowerCase() === 'qty')
      const amountIdx = headers.findIndex(h => h.toLowerCase().includes('amount') || h.toLowerCase() === 'total')

      if (nameIdx === -1) {
        alert('Could not find "Item name" column in CSV')
        return
      }

      const itemMap: Record<string, { qty: number; revenue: number }> = {}

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''))
        const name = cols[nameIdx]
        if (!name) continue

        const qty = qtyIdx >= 0 ? parseInt(cols[qtyIdx]) || 0 : 1
        const amount = amountIdx >= 0 ? parseFloat(cols[amountIdx]) || 0 : 0

        if (!itemMap[name]) itemMap[name] = { qty: 0, revenue: 0 }
        itemMap[name].qty += qty
        itemMap[name].revenue += amount
      }

      setPrepItems(prev => {
        const updated = [...prev]

        for (const [name, data] of Object.entries(itemMap)) {
          // Exact match only — "Mshikaki plate" should NOT match "Mshikaki"
          const existingIdx = updated.findIndex(item =>
            item.item_name.toLowerCase() === name.toLowerCase()
          )

          if (existingIdx >= 0) {
            updated[existingIdx] = {
              ...updated[existingIdx],
              actual_qty_sold: (updated[existingIdx].actual_qty_sold || 0) + data.qty,
              actual_revenue: Math.round(((updated[existingIdx].actual_revenue || 0) + data.revenue) * 100) / 100,
            }
          } else {
            updated.push({
              item_name: name,
              category: null,
              planned_qty: 0,
              planned_kg: null,
              planned_boxes: null,
              cost_per_kg: null,
              sell_price: data.qty > 0 ? Math.round((data.revenue / data.qty) * 100) / 100 : null,
              actual_qty_sold: data.qty,
              actual_revenue: Math.round(data.revenue * 100) / 100,
              notes: null,
              sort_order: updated.length,
            })
          }
        }

        return updated
      })

      setShowCsvImport(false)
    } catch (error) {
      console.error('CSV parse error:', error)
      alert('Failed to parse CSV file')
    }
  }

  // ─── Copy from Previous Event ─────────────────────────────────────────────

  const handleCopyFromEvent = async (sourceEventId: string) => {
    try {
      const response = await fetch(`/api/admin/events/${sourceEventId}`)
      if (!response.ok) return

      const sourceEvent = await response.json()
      const sourceItems = sourceEvent.event_prep_items || []

      setPrepItems(
        sourceItems.map((item: PrepItem, index: number) => ({
          item_name: item.item_name,
          category: item.category,
          planned_qty: item.planned_qty,
          planned_kg: item.planned_kg,
          planned_boxes: item.planned_boxes,
          cost_per_kg: item.cost_per_kg,
          sell_price: item.sell_price,
          actual_qty_sold: null,
          actual_revenue: null,
          notes: null,
          sort_order: index,
        }))
      )

      setShowCopyFromEvent(false)
    } catch (error) {
      console.error('Error copying from event:', error)
    }
  }

  // ─── Computed Values ──────────────────────────────────────────────────────

  const shoppingList = useMemo(() => {
    return prepItems
      .filter(item => item.planned_kg && item.planned_kg > 0)
      .map(item => {
        const key = item.item_name.toLowerCase()
        const purchaseUnit = Object.entries(PURCHASE_UNITS).find(([k]) => key.includes(k))
        const unit = purchaseUnit ? purchaseUnit[1].unit : 'kg'
        const boxes = item.planned_boxes
        const estCost = item.cost_per_kg && item.planned_kg
          ? Math.round(item.cost_per_kg * item.planned_kg * 100) / 100
          : null

        return { item_name: item.item_name, kg: item.planned_kg!, boxes, unit, estCost }
      })
  }, [prepItems])

  const totalEstCost = useMemo(() => {
    return prepItems.reduce((sum, item) => {
      if (item.cost_per_kg && item.planned_kg) return sum + item.cost_per_kg * item.planned_kg
      return sum
    }, 0)
  }, [prepItems])

  const totalEstRevenue = useMemo(() => {
    return prepItems.reduce((sum, item) => {
      if (item.sell_price && item.planned_qty) return sum + item.sell_price * item.planned_qty
      return sum
    }, 0)
  }, [prepItems])

  const totalActualRevenue = useMemo(() => {
    return prepItems.reduce((sum, item) => sum + (item.actual_revenue || 0), 0)
  }, [prepItems])

  const pastEventComparison = useMemo(() => {
    if (!selectedEvent) return []
    return events.filter(e => e.id !== selectedEvent.id && e.status === 'completed')
  }, [events, selectedEvent])

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading && events.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-[90px] lg:pl-64">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[90px] lg:pl-64">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">

        {viewMode === 'list' ? (
          <>
            {/* ─── Header ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
                Event Planner
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={openDefaultsModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  Item Costs
                </button>
                <button
                  onClick={() => { resetForm(); setShowCreateModal(true) }}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg transition"
                  style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}
                >
                  + Create Event
                </button>
              </div>
            </div>

            {/* ─── Filter Tabs ─────────────────────────────────────────── */}
            <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
              {(['all', 'planning', 'completed'] as FilterTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
                    filterTab === tab
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab !== 'all' && (
                    <span className="ml-1.5 text-xs text-gray-400">
                      {events.filter(e => tab === 'all' || e.status === tab).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ─── Events Table ─────────────────────────────────────────── */}
            {filteredEvents.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-500 text-lg mb-2">No events yet</p>
                <p className="text-gray-400 text-sm mb-4">Create your first event to start planning</p>
                <button
                  onClick={() => { resetForm(); setShowCreateModal(true) }}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg transition"
                  style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}
                >
                  + Create Event
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Event</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Pack</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map(event => (
                      <tr
                        key={event.id}
                        onClick={() => fetchEventDetail(event.id)}
                        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{event.name}</p>
                          {event.location && <p className="text-xs text-gray-500 mt-0.5">{event.location}</p>}
                          <p className="text-xs text-gray-400 sm:hidden mt-0.5">
                            {new Date(event.date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                          {new Date(event.date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 capitalize hidden md:table-cell">{event.event_type}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {event.pack_level === 'pack1' ? 'Pack 1' : event.pack_level === 'pack2' ? 'Pack 2' : 'Custom'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            event.status === 'planning' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                          }`}>
                            {event.status === 'planning' ? 'Planning' : 'Completed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : selectedEvent ? (
          <>
            {/* ─── Detail View ─────────────────────────────────────────── */}

            {/* Back + Actions */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => { setViewMode('list'); setSelectedEvent(null) }}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <span>←</span> Back to Events
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleToggleStatus}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    selectedEvent.status === 'planning'
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {selectedEvent.status === 'planning' ? 'Mark Completed' : 'Reopen'}
                </button>
                <button
                  onClick={() => {
                    setFormData({
                      name: selectedEvent.name,
                      date: selectedEvent.date,
                      start_time: selectedEvent.start_time || '',
                      end_time: selectedEvent.end_time || '',
                      event_type: selectedEvent.event_type,
                      expected_guests: selectedEvent.expected_guests?.toString() || '',
                      location: selectedEvent.location || '',
                      notes: selectedEvent.notes || '',
                      pack_level: selectedEvent.pack_level,
                    })
                    setShowEditModal(true)
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteEvent}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Event Info Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{selectedEvent.name}</h1>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                    <span>{new Date(selectedEvent.date).toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    {selectedEvent.start_time && selectedEvent.end_time && (
                      <span>{selectedEvent.start_time.slice(0, 5)} – {selectedEvent.end_time.slice(0, 5)}</span>
                    )}
                    {selectedEvent.location && <span>{selectedEvent.location}</span>}
                    {selectedEvent.expected_guests && <span>{selectedEvent.expected_guests} guests</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    selectedEvent.status === 'planning' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                  }`}>
                    {selectedEvent.status === 'planning' ? 'Planning' : 'Completed'}
                  </span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">
                    {selectedEvent.event_type}
                  </span>
                </div>
              </div>
              {selectedEvent.notes && <p className="mt-3 text-sm text-gray-500">{selectedEvent.notes}</p>}
            </div>

            {/* Pack Level + Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Pack Level:</span>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                  {(['pack1', 'pack2', 'custom'] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => handlePackLevelChange(level)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                        selectedEvent.pack_level === level
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {level === 'pack1' ? 'Pack 1 (Busy)' : level === 'pack2' ? 'Pack 2 (Very Busy)' : 'Custom'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowCopyFromEvent(true)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Copy from Event
                </button>
                <button
                  onClick={() => setShowCsvImport(true)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Import SumUp CSV
                </button>
                <button
                  onClick={() => setShowShoppingList(!showShoppingList)}
                  className="px-3 py-1.5 text-xs font-medium text-white rounded-lg transition"
                  style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}
                >
                  {showShoppingList ? 'Hide' : 'Show'} Shopping List
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 uppercase font-medium">Items</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{prepItems.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 uppercase font-medium">Total Kg</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {prepItems.reduce((sum, item) => sum + (item.planned_kg || 0), 0).toFixed(0)}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 uppercase font-medium">Est. Cost</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">€{totalEstCost.toFixed(0)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 uppercase font-medium">Est. Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">€{totalEstRevenue.toFixed(0)}</p>
              </div>
            </div>

            {/* Shopping List Panel */}
            {showShoppingList && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                  Shopping List — {selectedEvent.name} ({selectedEvent.pack_level === 'pack1' ? 'Pack 1' : selectedEvent.pack_level === 'pack2' ? 'Pack 2' : 'Custom'})
                </h3>
                <div className="border-t border-gray-200">
                  {shoppingList.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-100 text-sm">
                      <span className="font-medium text-gray-900 w-40">{item.item_name}</span>
                      <span className="text-gray-600 flex-1 text-right">
                        {item.boxes ? `${item.boxes} ${item.boxes === 1 ? 'box' : 'boxes'} (${item.kg}kg)` : `${item.kg} kg`}
                      </span>
                      <span className="text-gray-600 w-24 text-right">
                        {item.estCost ? `€${item.estCost.toFixed(2)}` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 mt-1 border-t-2 border-gray-300 text-sm font-bold">
                  <span>TOTAL ESTIMATED COST</span>
                  <span>€{totalEstCost.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Past Event Comparison */}
            {pastEventComparison.length > 0 && selectedEvent.status === 'planning' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-bold text-amber-900 mb-2">Past Event Reference</h3>
                <div className="space-y-2">
                  {pastEventComparison.slice(0, 3).map(pastEvent => (
                    <div key={pastEvent.id} className="text-xs text-amber-800">
                      <span className="font-medium">{pastEvent.name}</span>
                      <span className="text-amber-600 ml-1">
                        ({new Date(pastEvent.date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })})
                      </span>
                      {pastEvent.event_prep_items && pastEvent.event_prep_items.length > 0 && (
                        <span className="ml-1">
                          — {pastEvent.event_prep_items
                            .filter((item: PrepItem) => item.actual_qty_sold && item.actual_qty_sold > 0)
                            .slice(0, 4)
                            .map((item: PrepItem) => `${item.item_name}: ${item.actual_qty_sold} sold`)
                            .join(', ')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Prep Sheet ────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Prep Sheet</h2>
                  {/* Planning / Actuals tab toggle */}
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setPrepTab('planning')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                        prepTab === 'planning' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Planning
                    </button>
                    <button
                      onClick={() => setPrepTab('actuals')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                        prepTab === 'actuals' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Actuals
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleResetAllPrepItems}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                  >
                    Reset All
                  </button>
                  <button
                    onClick={handleAddPrepItem}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    + Add Item
                  </button>
                  <button
                    onClick={handleSavePrepItems}
                    disabled={saving}
                    className="px-4 py-1.5 text-xs font-medium text-white rounded-lg transition disabled:opacity-50"
                    style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                {prepTab === 'planning' ? (
                  /* ─── PLANNING TABLE ─── */
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        {[
                          { field: 'item_name', label: 'Item', align: 'left', w: 'w-[180px]' },
                          { field: 'category', label: 'Category', align: 'left', w: 'w-[80px]' },
                          { field: 'planned_qty', label: 'Portions', align: 'right', w: 'w-[90px]' },
                          { field: 'planned_kg', label: 'Raw Kg', align: 'right', w: 'w-[90px]' },
                          { field: 'planned_boxes', label: 'Boxes', align: 'right', w: 'w-[70px]' },
                          { field: 'cost_per_kg', label: 'Cost/Kg', align: 'right', w: 'w-[90px]' },
                          { field: 'est_cost', label: 'Est. Cost', align: 'right', w: 'w-[100px]' },
                          { field: 'sell_price', label: 'Sell Price', align: 'right', w: 'w-[90px]' },
                          { field: 'est_revenue', label: 'Est. Revenue', align: 'right', w: 'w-[100px]' },
                        ].map(col => (
                          <th
                            key={col.field}
                            onClick={() => handleSort(col.field)}
                            className={`text-${col.align} px-3 py-2.5 text-xs font-semibold text-gray-500 ${col.w} cursor-pointer hover:text-gray-700 select-none ${col.align === 'left' && col.field === 'item_name' ? 'pl-4' : ''}`}
                          >
                            {col.label}
                            {sortField === col.field && (
                              <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </th>
                        ))}
                        <th className="w-[40px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPrepItems.map((item) => {
                        const realIndex = prepItems.indexOf(item)
                        const estCost = item.cost_per_kg && item.planned_kg
                          ? Math.round(item.cost_per_kg * item.planned_kg * 100) / 100 : null
                        const estRevenue = item.sell_price && item.planned_qty
                          ? Math.round(item.sell_price * item.planned_qty * 100) / 100 : null

                        return (
                          <tr key={item.id || `new-${realIndex}`} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={item.item_name}
                                onChange={(e) => handlePrepItemChange(realIndex, 'item_name', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm font-medium border border-transparent hover:border-gray-200 focus:border-gray-300 rounded focus:outline-none bg-transparent"
                                placeholder="Item name"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={item.category || ''}
                                onChange={(e) => handlePrepItemChange(realIndex, 'category', e.target.value || null)}
                                className="w-full px-2 py-1.5 text-sm border border-transparent hover:border-gray-200 focus:border-gray-300 rounded focus:outline-none text-gray-500 bg-transparent"
                                placeholder="—"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={item.planned_qty || ''}
                                onChange={(e) => handlePrepItemChange(realIndex, 'planned_qty', parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 text-sm text-right border border-transparent hover:border-gray-200 focus:border-gray-300 rounded focus:outline-none bg-transparent"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="0.1"
                                value={item.planned_kg ?? ''}
                                onChange={(e) => handlePrepItemChange(realIndex, 'planned_kg', parseFloat(e.target.value) || null)}
                                className="w-full px-2 py-1.5 text-sm text-right border border-transparent hover:border-gray-200 focus:border-gray-300 rounded focus:outline-none bg-transparent"
                                placeholder="—"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={item.planned_boxes ?? ''}
                                onChange={(e) => handlePrepItemChange(realIndex, 'planned_boxes', parseInt(e.target.value) || null)}
                                className="w-full px-2 py-1.5 text-sm text-right border border-transparent hover:border-gray-200 focus:border-gray-300 rounded focus:outline-none bg-transparent"
                                placeholder="—"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="0.01"
                                value={item.cost_per_kg ?? ''}
                                onChange={(e) => handlePrepItemChange(realIndex, 'cost_per_kg', parseFloat(e.target.value) || null)}
                                className="w-full px-2 py-1.5 text-sm text-right border border-transparent hover:border-gray-200 focus:border-gray-300 rounded focus:outline-none bg-transparent"
                                placeholder="—"
                              />
                            </td>
                            <td className="px-3 py-2 text-right text-sm text-gray-500 font-medium">
                              {estCost ? `€${estCost.toFixed(2)}` : '—'}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="0.01"
                                value={item.sell_price ?? ''}
                                onChange={(e) => handlePrepItemChange(realIndex, 'sell_price', parseFloat(e.target.value) || null)}
                                className="w-full px-2 py-1.5 text-sm text-right border border-transparent hover:border-gray-200 focus:border-gray-300 rounded focus:outline-none bg-transparent"
                                placeholder="—"
                              />
                            </td>
                            <td className="px-3 py-2 text-right text-sm text-gray-500 font-medium">
                              {estRevenue ? `€${estRevenue.toFixed(2)}` : '—'}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                onClick={() => handleDeletePrepItem(item.id || '', realIndex)}
                                className="text-gray-300 hover:text-red-500 transition"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    {prepItems.length > 0 && (
                      <tfoot>
                        <tr className="bg-gray-50 font-semibold text-sm">
                          <td className="px-4 py-3 text-gray-900" colSpan={2}>Totals</td>
                          <td className="px-3 py-3 text-right text-gray-900">
                            {prepItems.reduce((s, i) => s + (i.planned_qty || 0), 0)}
                          </td>
                          <td className="px-3 py-3 text-right text-gray-900">
                            {prepItems.reduce((s, i) => s + (i.planned_kg || 0), 0).toFixed(1)}
                          </td>
                          <td className="px-3 py-3 text-right text-gray-900">
                            {prepItems.reduce((s, i) => s + (i.planned_boxes || 0), 0) || '—'}
                          </td>
                          <td className="px-3 py-3"></td>
                          <td className="px-3 py-3 text-right text-gray-900">€{totalEstCost.toFixed(2)}</td>
                          <td className="px-3 py-3"></td>
                          <td className="px-3 py-3 text-right text-gray-900">€{totalEstRevenue.toFixed(2)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                ) : (
                  /* ─── ACTUALS TABLE ─── */
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        {[
                          { field: 'item_name', label: 'Item', align: 'left', w: 'w-[200px]' },
                          { field: 'planned_qty', label: 'Planned Qty', align: 'right', w: 'w-[120px]' },
                          { field: 'actual_qty_sold', label: 'Actual Sold', align: 'right', w: 'w-[120px]' },
                          { field: 'difference', label: 'Difference', align: 'right', w: 'w-[120px]' },
                          { field: 'actual_revenue', label: 'Actual Revenue', align: 'right', w: 'w-[140px]' },
                          { field: 'sell_price', label: 'Sell Price', align: 'right', w: 'w-[120px]' },
                        ].map(col => (
                          <th
                            key={col.field}
                            onClick={() => handleSort(col.field)}
                            className={`text-${col.align} px-4 py-2.5 text-xs font-semibold text-gray-500 ${col.w} cursor-pointer hover:text-gray-700 select-none`}
                          >
                            {col.label}
                            {sortField === col.field && (
                              <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </th>
                        ))}
                        <th className="w-[40px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPrepItems.map((item) => {
                        const realIndex = prepItems.indexOf(item)
                        const diff = (item.actual_qty_sold || 0) - (item.planned_qty || 0)
                        return (
                          <tr key={item.id || `new-${realIndex}`} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="px-4 py-2.5 font-medium text-gray-900">{item.item_name || '—'}</td>
                            <td className="px-4 py-2.5 text-right text-gray-600">{item.planned_qty || 0}</td>
                            <td className="px-4 py-2.5">
                              <input
                                type="number"
                                value={item.actual_qty_sold ?? ''}
                                onChange={(e) => handlePrepItemChange(realIndex, 'actual_qty_sold', parseInt(e.target.value) || null)}
                                className="w-full px-2 py-1.5 text-sm text-right border border-transparent hover:border-gray-200 focus:border-gray-300 rounded focus:outline-none bg-transparent"
                                placeholder="—"
                              />
                            </td>
                            <td className={`px-4 py-2.5 text-right font-medium ${
                              diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'
                            }`}>
                              {item.actual_qty_sold != null ? (diff > 0 ? `+${diff}` : diff) : '—'}
                            </td>
                            <td className="px-4 py-2.5">
                              <input
                                type="number"
                                step="0.01"
                                value={item.actual_revenue ?? ''}
                                onChange={(e) => handlePrepItemChange(realIndex, 'actual_revenue', parseFloat(e.target.value) || null)}
                                className="w-full px-2 py-1.5 text-sm text-right border border-transparent hover:border-gray-200 focus:border-gray-300 rounded focus:outline-none bg-transparent"
                                placeholder="—"
                              />
                            </td>
                            <td className="px-4 py-2.5 text-right text-gray-500">
                              {item.sell_price ? `€${item.sell_price.toFixed(2)}` : '—'}
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              <button
                                onClick={() => handleDeletePrepItem(item.id || '', realIndex)}
                                className="text-gray-300 hover:text-red-500 transition"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    {prepItems.length > 0 && (
                      <tfoot>
                        <tr className="bg-gray-50 font-semibold text-sm">
                          <td className="px-4 py-3 text-gray-900">Totals</td>
                          <td className="px-4 py-3 text-right text-gray-900">
                            {prepItems.reduce((s, i) => s + (i.planned_qty || 0), 0)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900">
                            {prepItems.reduce((s, i) => s + (i.actual_qty_sold || 0), 0)}
                          </td>
                          <td className="px-4 py-3"></td>
                          <td className="px-4 py-3 text-right text-gray-900">
                            €{totalActualRevenue.toFixed(2)}
                          </td>
                          <td className="px-4 py-3"></td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                )}
              </div>
            </div>
          </>
        ) : null}

        {/* ─── Create/Edit Event Modal ───────────────────────────────────── */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">
                  {showEditModal ? 'Edit Event' : 'Create Event'}
                </h2>
              </div>
              <div className="p-5 space-y-4">
                {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                    placeholder="e.g. Tanzania Day 2026"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select value={formData.event_type} onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value as Event['event_type'] }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400">
                      <option value="festival">Festival</option>
                      <option value="market">Market</option>
                      <option value="private">Private</option>
                      <option value="corporate">Corporate</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input type="time" value={formData.start_time} onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input type="time" value={formData.end_time} onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Guests</label>
                    <input type="number" value={formData.expected_guests} onChange={(e) => setFormData(prev => ({ ...prev, expected_guests: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400" placeholder="e.g. 500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pack Level</label>
                    <select value={formData.pack_level} onChange={(e) => setFormData(prev => ({ ...prev, pack_level: e.target.value as Event['pack_level'] }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400">
                      <option value="pack1">Pack 1 (Busy)</option>
                      <option value="pack2">Pack 2 (Very Busy)</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400" placeholder="e.g. Smithfield Square, Dublin" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400" rows={3} placeholder="Any additional notes..." />
                </div>
              </div>
              <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
                <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); setError('') }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
                <button onClick={showEditModal ? handleUpdateEvent : handleCreateEvent} disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50"
                  style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}>
                  {saving ? 'Saving...' : showEditModal ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Item Costs / Defaults Modal ───────────────────────────────── */}
        {showDefaultsModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Default Item Costs</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Set your default cost and sell prices per item. These will auto-populate when you create new events.
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left pb-2 text-xs font-semibold text-gray-500 w-[160px]">Item</th>
                      <th className="text-left pb-2 text-xs font-semibold text-gray-500 w-[80px]">Unit</th>
                      <th className="text-right pb-2 text-xs font-semibold text-gray-500 w-[110px]">Cost / Kg</th>
                      <th className="text-right pb-2 text-xs font-semibold text-gray-500 w-[110px]">Cost / Piece</th>
                      <th className="text-right pb-2 text-xs font-semibold text-gray-500 w-[110px]">Sell Price</th>
                      <th className="w-[30px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {editingDefaults.map((item, index) => (
                      <tr key={index} className="border-b border-gray-50">
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={item.item_name}
                            onChange={(e) => handleDefaultChange(index, 'item_name', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                            placeholder="Item name"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <select
                            value={item.unit}
                            onChange={(e) => handleDefaultChange(index, 'unit', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                          >
                            <option value="kg">kg</option>
                            <option value="piece">piece</option>
                            <option value="box">box</option>
                          </select>
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            step="0.01"
                            value={item.cost_per_kg ?? ''}
                            onChange={(e) => handleDefaultChange(index, 'cost_per_kg', parseFloat(e.target.value) || null)}
                            className="w-full px-2 py-1.5 text-sm text-right border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                            placeholder="€0.00"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            step="0.01"
                            value={item.cost_per_piece ?? ''}
                            onChange={(e) => handleDefaultChange(index, 'cost_per_piece', parseFloat(e.target.value) || null)}
                            className="w-full px-2 py-1.5 text-sm text-right border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                            placeholder="€0.00"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            step="0.01"
                            value={item.default_sell_price ?? ''}
                            onChange={(e) => handleDefaultChange(index, 'default_sell_price', parseFloat(e.target.value) || null)}
                            className="w-full px-2 py-1.5 text-sm text-right border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                            placeholder="€0.00"
                          />
                        </td>
                        <td className="py-2 text-center">
                          <button
                            onClick={() => setEditingDefaults(prev => prev.filter((_, i) => i !== index))}
                            className="text-gray-300 hover:text-red-500 transition"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  onClick={handleAddDefault}
                  className="mt-3 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  + Add Item
                </button>
              </div>
              <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
                <button onClick={() => setShowDefaultsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
                <button onClick={handleSaveDefaults} disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50"
                  style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}>
                  {saving ? 'Saving...' : 'Save Defaults'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── SumUp CSV Import Modal ────────────────────────────────────── */}
        {showCsvImport && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-lg">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Import SumUp Sales Data</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Export your sales from SumUp as CSV, then paste or upload it here.
                </p>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload CSV file</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (ev) => {
                          const text = ev.target?.result as string
                          if (text) handleCsvImport(text)
                        }
                        reader.readAsText(file)
                      }
                    }}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                </div>
                <div className="text-center text-xs text-gray-400">— or paste CSV text —</div>
                <textarea
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:border-gray-400"
                  rows={8}
                  placeholder="Item name,Variant name,Category,SKU,Quantity,Currency,Amount"
                  id="csvTextArea"
                />
              </div>
              <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
                <button onClick={() => setShowCsvImport(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
                <button
                  onClick={() => {
                    const textarea = document.getElementById('csvTextArea') as HTMLTextAreaElement
                    if (textarea?.value) handleCsvImport(textarea.value)
                  }}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg transition"
                  style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}>
                  Import
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Copy from Event Modal ─────────────────────────────────────── */}
        {showCopyFromEvent && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Copy from Previous Event</h2>
                <p className="text-sm text-gray-500 mt-1">Select a past event to copy its prep items.</p>
              </div>
              <div className="p-5 max-h-80 overflow-y-auto">
                {events.filter(e => e.id !== selectedEvent?.id).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No other events to copy from</p>
                ) : (
                  <div className="space-y-2">
                    {events.filter(e => e.id !== selectedEvent?.id).map(event => (
                      <button key={event.id} onClick={() => handleCopyFromEvent(event.id)}
                        className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                        <p className="font-medium text-gray-900 text-sm">{event.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(event.date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' · '}{event.event_type}{' · '}{event.status}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-5 border-t border-gray-100 flex justify-end">
                <button onClick={() => setShowCopyFromEvent(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
