'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface BusinessSettings {
  // Business Profile
  business_name?: string
  business_email?: string
  business_phone?: string
  pickup_address?: string
  pickup_instructions?: string
  
  // Fulfillment Modes
  service_types?: string[]
  
  // Opening Hours (JSONB)
  business_hours?: Record<string, { open: string; close: string; closed?: boolean }>
  
  // Time Slots
  lead_time_minutes?: number
  
  // Blackout Dates
  blackout_dates?: string[]
  
  // Capacity
  max_orders_per_slot?: number // Legacy: general capacity (for backward compatibility)
  max_orders_per_pickup_slot?: number
  max_orders_per_delivery_window?: number
  max_orders_per_day?: number
  
  // Order Notes Policy
  order_notes_max_length?: number
  order_notes_policy?: string
  
  // Other
  timezone?: string
  min_order_value?: number
  accepting_orders?: boolean
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export default function AdminSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<BusinessSettings>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('profile')

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
      fetchSettings()
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/admin/login')
    }
  }

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/business-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data || {})
      } else {
        setError('Failed to load settings')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await fetch('/api/admin/business-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setSuccess('Settings saved successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const updateBusinessHours = (day: string, field: 'open' | 'close' | 'closed', value: any) => {
    setSettings(prev => {
      const hours = prev.business_hours || {}
      if (!hours[day]) hours[day] = { open: '09:00', close: '22:00' }
      hours[day] = { ...hours[day], [field]: value }
      return { ...prev, business_hours: hours }
    })
  }

  const addBlackoutDate = () => {
    const date = prompt('Enter date (YYYY-MM-DD):')
    if (date) {
      const dates = settings.blackout_dates || []
      if (!dates.includes(date)) {
        updateField('blackout_dates', [...dates, date])
      }
    }
  }

  const removeBlackoutDate = (date: string) => {
    const dates = settings.blackout_dates || []
    updateField('blackout_dates', dates.filter(d => d !== date))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Settings</h1>
        <p className="text-gray-600">Configure your business profile, hours, and ordering rules</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'profile', label: 'Business Profile' },
            { id: 'fulfillment', label: 'Fulfillment' },
            { id: 'hours', label: 'Opening Hours' },
            { id: 'slots', label: 'Time Slots' },
            { id: 'capacity', label: 'Capacity' },
            { id: 'notes', label: 'Order Notes' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-[var(--brand-primary,#C9653B)] text-[var(--brand-primary,#C9653B)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Business Profile */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Business Profile</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={settings.business_name || ''}
                onChange={(e) => updateField('business_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Email
              </label>
              <input
                type="email"
                value={settings.business_email || ''}
                onChange={(e) => updateField('business_email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Phone
              </label>
              <input
                type="tel"
                value={settings.business_phone || ''}
                onChange={(e) => updateField('business_phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Address
              </label>
              <textarea
                value={settings.pickup_address || ''}
                onChange={(e) => updateField('pickup_address', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
                placeholder="Street address, city, postcode"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Instructions
              </label>
              <textarea
                value={settings.pickup_instructions || ''}
                onChange={(e) => updateField('pickup_instructions', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
                placeholder="Instructions for customers picking up orders"
              />
            </div>
          </div>
        )}

        {/* Fulfillment Modes */}
        {activeTab === 'fulfillment' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Fulfillment Modes</h2>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.service_types?.includes('pickup') || false}
                  onChange={(e) => {
                    const types = settings.service_types || []
                    if (e.target.checked) {
                      updateField('service_types', [...types.filter(t => t !== 'pickup'), 'pickup'])
                    } else {
                      updateField('service_types', types.filter(t => t !== 'pickup'))
                    }
                  }}
                  className="rounded border-gray-300 text-[var(--brand-primary,#C9653B)] focus:ring-[var(--brand-primary,#C9653B)]"
                />
                <span className="text-sm font-medium text-gray-700">Pickup Available</span>
              </label>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.service_types?.includes('delivery') || false}
                  onChange={(e) => {
                    const types = settings.service_types || []
                    if (e.target.checked) {
                      updateField('service_types', [...types.filter(t => t !== 'delivery'), 'delivery'])
                    } else {
                      updateField('service_types', types.filter(t => t !== 'delivery'))
                    }
                  }}
                  className="rounded border-gray-300 text-[var(--brand-primary,#C9653B)] focus:ring-[var(--brand-primary,#C9653B)]"
                />
                <span className="text-sm font-medium text-gray-700">Delivery Available</span>
              </label>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.accepting_orders ?? true}
                  onChange={(e) => updateField('accepting_orders', e.target.checked)}
                  className="rounded border-gray-300 text-[var(--brand-primary,#C9653B)] focus:ring-[var(--brand-primary,#C9653B)]"
                />
                <span className="text-sm font-medium text-gray-700">Accepting Orders</span>
              </label>
            </div>
          </div>
        )}

        {/* Opening Hours */}
        {activeTab === 'hours' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Opening Hours</h2>
            
            <div className="space-y-4">
              {DAYS.map(day => {
                const dayHours = settings.business_hours?.[day] || { open: '09:00', close: '22:00' }
                const isClosed = dayHours.closed || false
                
                return (
                  <div key={day} className="flex items-center space-x-4">
                    <div className="w-24 text-sm font-medium text-gray-700 capitalize">
                      {day}
                    </div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isClosed}
                        onChange={(e) => updateBusinessHours(day, 'closed', e.target.checked)}
                        className="rounded border-gray-300 text-[var(--brand-primary,#C9653B)] focus:ring-[var(--brand-primary,#C9653B)]"
                      />
                      <span className="text-sm text-gray-600">Closed</span>
                    </label>
                    {!isClosed && (
                      <>
                        <input
                          type="time"
                          value={dayHours.open || '09:00'}
                          onChange={(e) => updateBusinessHours(day, 'open', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          value={dayHours.close || '22:00'}
                          onChange={(e) => updateBusinessHours(day, 'close', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
                        />
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Time Slots */}
        {activeTab === 'slots' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Time Slots & Lead Time</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead Time (minutes before pickup)
              </label>
              <input
                type="number"
                value={settings.lead_time_minutes || 120}
                onChange={(e) => updateField('lead_time_minutes', parseInt(e.target.value) || 120)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
                min="0"
              />
              <p className="mt-1 text-sm text-gray-500">
                Orders must be placed at least this many minutes before the pickup time
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blackout Dates (fully booked / closed)
              </label>
              <div className="space-y-2">
                {(settings.blackout_dates || []).map(date => (
                  <div key={date} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{date}</span>
                    <button
                      onClick={() => removeBlackoutDate(date)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={addBlackoutDate}
                  className="px-4 py-2 text-sm text-[var(--brand-primary,#C9653B)] border border-[var(--brand-primary,#C9653B)] rounded hover:bg-[var(--brand-primary,#C9653B)] hover:text-white"
                >
                  + Add Blackout Date
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Capacity */}
        {activeTab === 'capacity' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Order Capacity</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Delivery windows are typically 2 hours, so capacity should be lower than pickup slots (which are 30-60 minutes).
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Orders Per Pickup Slot
              </label>
              <input
                type="number"
                value={settings.max_orders_per_pickup_slot || settings.max_orders_per_slot || 10}
                onChange={(e) => updateField('max_orders_per_pickup_slot', parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
                min="1"
              />
              <p className="mt-1 text-sm text-gray-500">
                Recommended: 10-20 orders per pickup slot (30-60 min windows)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Orders Per Delivery Window
              </label>
              <input
                type="number"
                value={settings.max_orders_per_delivery_window || 5}
                onChange={(e) => updateField('max_orders_per_delivery_window', parseInt(e.target.value) || 5)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
                min="1"
              />
              <p className="mt-1 text-sm text-gray-500">
                Recommended: 3-8 orders per delivery window (2-hour windows, depends on distance)
              </p>
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Orders Per Day (Optional)
              </label>
              <input
                type="number"
                value={settings.max_orders_per_day || ''}
                onChange={(e) => updateField('max_orders_per_day', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
                min="1"
                placeholder="Leave empty for unlimited"
              />
              <p className="mt-1 text-sm text-gray-500">
                Optional: Set a daily cap to prevent overbooking
              </p>
            </div>
          </div>
        )}

        {/* Order Notes Policy */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Order Notes Policy</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Length (characters)
              </label>
              <input
                type="number"
                value={settings.order_notes_max_length || 500}
                onChange={(e) => updateField('order_notes_max_length', parseInt(e.target.value) || 500)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Policy Text
              </label>
              <textarea
                value={settings.order_notes_policy || ''}
                onChange={(e) => updateField('order_notes_policy', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
                placeholder="Free text, max 500 characters. No special characters allowed."
              />
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-[var(--brand-primary,#C9653B)] text-white rounded-md hover:bg-[var(--brand-primary,#C9653B)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

