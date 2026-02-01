'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface MenuItem {
  id: string
  name: string
  price: number
  is_available: boolean
  is_published: boolean
  category_id: string | null
  menu_categories?: { name: string }
  // Inventory fields (will work once migration is run)
  track_inventory?: boolean
  stock_quantity?: number | null
  low_stock_threshold?: number | null
  auto_disable_on_zero?: boolean
}

export default function AdminInventoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<MenuItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out' | 'tracked'>('all')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustQuantity, setAdjustQuantity] = useState(0)
  const [csrfToken, setCsrfToken] = useState('')
  const [saving, setSaving] = useState(false)

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

      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf')
      if (csrfResponse.ok) {
        const { csrfToken } = await csrfResponse.json()
        setCsrfToken(csrfToken)
      }

      await fetchItems()
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/admin/login')
    }
  }

  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/menu/items')
      if (response.ok) {
        const data = await response.json()
        setItems(data || [])
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter items
  const filteredItems = useMemo(() => {
    let result = items

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.menu_categories?.name?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (filterStatus === 'tracked') {
      result = result.filter(item => item.track_inventory)
    } else if (filterStatus === 'low') {
      result = result.filter(item =>
        item.track_inventory &&
        item.stock_quantity !== undefined &&
        item.stock_quantity !== null &&
        item.low_stock_threshold !== undefined &&
        item.low_stock_threshold !== null &&
        item.stock_quantity <= item.low_stock_threshold &&
        item.stock_quantity > 0
      )
    } else if (filterStatus === 'out') {
      result = result.filter(item =>
        item.track_inventory &&
        item.stock_quantity !== undefined &&
        item.stock_quantity !== null &&
        item.stock_quantity === 0
      )
    }

    return result
  }, [items, searchQuery, filterStatus])

  // Calculate stats
  const trackedCount = items.filter(i => i.track_inventory).length
  const lowStockCount = items.filter(i =>
    i.track_inventory &&
    i.stock_quantity !== undefined &&
    i.stock_quantity !== null &&
    i.low_stock_threshold !== undefined &&
    i.low_stock_threshold !== null &&
    i.stock_quantity <= i.low_stock_threshold &&
    i.stock_quantity > 0
  ).length
  const outOfStockCount = items.filter(i =>
    i.track_inventory &&
    i.stock_quantity !== undefined &&
    i.stock_quantity !== null &&
    i.stock_quantity === 0
  ).length

  const handleAdjustStock = (item: MenuItem) => {
    setSelectedItem(item)
    setAdjustQuantity(item.stock_quantity || 0)
    setShowAdjustModal(true)
  }

  const handleToggleTracking = async (item: MenuItem) => {
    if (!csrfToken) return

    try {
      setSaving(true)
      const response = await fetch(`/api/admin/menu/items/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({
          track_inventory: !item.track_inventory,
          stock_quantity: !item.track_inventory ? 0 : null,
          low_stock_threshold: !item.track_inventory ? 10 : null
        })
      })

      if (response.ok) {
        await fetchItems()
      } else {
        alert('Failed to update tracking')
      }
    } catch (error) {
      console.error('Error updating item:', error)
      alert('Failed to update tracking')
    } finally {
      setSaving(false)
    }
  }

  const submitAdjustment = async () => {
    if (!selectedItem || !csrfToken) return

    try {
      setSaving(true)
      const response = await fetch(`/api/admin/menu/items/${selectedItem.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({
          stock_quantity: adjustQuantity,
          // Auto-disable if stock is 0 and auto_disable is enabled
          is_available: selectedItem.auto_disable_on_zero !== false && adjustQuantity === 0
            ? false
            : selectedItem.is_available
        })
      })

      if (response.ok) {
        setShowAdjustModal(false)
        await fetchItems()
      } else {
        alert('Failed to adjust stock')
      }
    } catch (error) {
      console.error('Error adjusting stock:', error)
      alert('Failed to adjust stock')
    } finally {
      setSaving(false)
    }
  }

  const getStockStatus = (item: MenuItem) => {
    if (!item.track_inventory) return 'untracked'
    if (item.stock_quantity === undefined || item.stock_quantity === null) return 'unlimited'
    if (item.stock_quantity === 0) return 'out'
    if (item.low_stock_threshold !== undefined && item.low_stock_threshold !== null && item.stock_quantity <= item.low_stock_threshold) return 'low'
    return 'in_stock'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading inventory...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
            Inventory Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">Track and manage stock levels for menu items</p>
        </div>
        <Link
          href="/admin/menu"
          className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-center"
        >
          Back to Menu
        </Link>
      </div>

      {/* Info Banner */}
      {trackedCount === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-1">No items are being tracked yet</h3>
          <p className="text-sm text-blue-700">
            Enable inventory tracking for items you want to monitor. Click the "Enable Tracking" button next to any item to start tracking its stock.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Items</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{items.length}</div>
        </div>
        <div className="bg-white border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-700">Tracked Items</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{trackedCount}</div>
        </div>
        <div className="bg-white border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-700">Low Stock</div>
          <div className="text-2xl font-bold text-yellow-700 mt-1">{lowStockCount}</div>
        </div>
        <div className="bg-white border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-700">Out of Stock</div>
          <div className="text-2xl font-bold text-red-700 mt-1">{outOfStockCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)] focus:border-transparent text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-2 text-sm rounded-md font-medium ${
                filterStatus === 'all'
                  ? 'bg-[var(--brand-primary,#C9653B)]/10 text-[var(--brand-primary,#C9653B)]'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setFilterStatus('tracked')}
              className={`px-3 py-2 text-sm rounded-md font-medium ${
                filterStatus === 'tracked'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tracked ({trackedCount})
            </button>
            <button
              onClick={() => setFilterStatus('low')}
              className={`px-3 py-2 text-sm rounded-md font-medium ${
                filterStatus === 'low'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Low ({lowStockCount})
            </button>
            <button
              onClick={() => setFilterStatus('out')}
              className={`px-3 py-2 text-sm rounded-md font-medium ${
                filterStatus === 'out'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Out ({outOfStockCount})
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F1E7DA] border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#4B4B4B] uppercase">Item</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#4B4B4B] uppercase hidden lg:table-cell">Category</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[#4B4B4B] uppercase">Stock</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[#4B4B4B] uppercase hidden lg:table-cell">Threshold</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[#4B4B4B] uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#4B4B4B] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No items found
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const status = getStockStatus(item)

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">€{item.price.toFixed(2)}</div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-gray-600">
                          {item.menu_categories?.name || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.track_inventory ? (
                          <span className={`text-lg font-bold ${
                            status === 'out' ? 'text-red-700' :
                            status === 'low' ? 'text-yellow-700' :
                            'text-gray-900'
                          }`}>
                            {item.stock_quantity ?? '∞'}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <span className="text-sm text-gray-600">
                          {item.track_inventory ? (item.low_stock_threshold ?? '-') : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {status === 'untracked' ? (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600">
                            Not Tracked
                          </span>
                        ) : status === 'out' ? (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700">
                            Out of Stock
                          </span>
                        ) : status === 'low' ? (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-700">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {item.track_inventory ? (
                            <>
                              <button
                                onClick={() => handleAdjustStock(item)}
                                className="px-3 py-1.5 text-xs font-medium text-white rounded"
                                style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}
                              >
                                Adjust
                              </button>
                              <button
                                onClick={() => handleToggleTracking(item)}
                                disabled={saving}
                                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                              >
                                Disable
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleToggleTracking(item)}
                              disabled={saving}
                              className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                            >
                              Enable Tracking
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden divide-y divide-gray-100">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No items found
            </div>
          ) : (
            filteredItems.map((item) => {
              const status = getStockStatus(item)

              return (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.menu_categories?.name || 'No category'}</div>
                    </div>
                    {status === 'untracked' ? (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600">
                        Not Tracked
                      </span>
                    ) : status === 'out' ? (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700">
                        Out
                      </span>
                    ) : status === 'low' ? (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-700">
                        Low
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
                        In Stock
                      </span>
                    )}
                  </div>
                  {item.track_inventory && (
                    <div className="text-sm text-gray-600 mb-3">
                      Stock: <span className="font-semibold">{item.stock_quantity ?? '∞'}</span>
                      {item.low_stock_threshold && (
                        <span className="ml-2">/ Threshold: {item.low_stock_threshold}</span>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {item.track_inventory ? (
                      <>
                        <button
                          onClick={() => handleAdjustStock(item)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-white rounded"
                          style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}
                        >
                          Adjust Stock
                        </button>
                        <button
                          onClick={() => handleToggleTracking(item)}
                          disabled={saving}
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          Disable
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleToggleTracking(item)}
                        disabled={saving}
                        className="w-full px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                      >
                        Enable Tracking
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Adjust Stock: {selectedItem.name}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock: {selectedItem.stock_quantity ?? 'Unlimited'}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAdjustQuantity(Math.max(0, adjustQuantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-lg font-bold bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-center text-lg font-semibold"
                  />
                  <button
                    onClick={() => setAdjustQuantity(adjustQuantity + 1)}
                    className="w-10 h-10 flex items-center justify-center text-lg font-bold bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                <strong>Quick adjust:</strong>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setAdjustQuantity(adjustQuantity + 10)}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => setAdjustQuantity(adjustQuantity + 25)}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded"
                  >
                    +25
                  </button>
                  <button
                    onClick={() => setAdjustQuantity(adjustQuantity + 50)}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded"
                  >
                    +50
                  </button>
                  <button
                    onClick={() => setAdjustQuantity(0)}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded"
                  >
                    Set 0
                  </button>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAdjustment}
                  disabled={saving}
                  className="px-4 py-2 text-sm text-white rounded-md disabled:opacity-50"
                  style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}
                >
                  {saving ? 'Saving...' : 'Update Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
