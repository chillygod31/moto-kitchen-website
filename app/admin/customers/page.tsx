'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface OrderItem {
  name_snapshot: string
  quantity: number
  line_total: number
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  total: number
  status: string
  payment_status: string
  fulfillment_type: string
  created_at: string
  order_items: OrderItem[]
}

interface Customer {
  email: string
  name: string
  phone: string
  orderCount: number
  lifetimeValue: number
  avgOrderValue: number
  firstOrderDate: string
  lastOrderDate: string
  orders: Order[]
}

export default function AdminCustomersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'lifetime_value' | 'order_count' | 'last_order_date'>('lifetime_value')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [currentTime, setCurrentTime] = useState<number | null>(null)

  useEffect(() => {
    // Set current time on client side only to avoid hydration mismatch
    setCurrentTime(Date.now())
    checkAuthAndFetch()
  }, [])

  const checkAuthAndFetch = async () => {
    try {
      const response = await fetch('/api/admin/session')
      if (!response.ok) {
        router.push('/admin/login')
        return
      }
      await fetchOrders()
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/admin/login')
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Aggregate customers from orders
  const customers = useMemo(() => {
    const customerMap = new Map<string, Customer>()

    orders.forEach(order => {
      if (!order.customer_email) return

      const email = order.customer_email.toLowerCase().trim()
      const existing = customerMap.get(email)

      if (existing) {
        // Update existing customer
        const isPaid = order.payment_status === 'paid' && order.status !== 'cancelled'
        if (isPaid) {
          existing.lifetimeValue += order.total
          existing.orderCount++
        }
        existing.orders.push(order)

        // Use most recent name
        if (new Date(order.created_at) > new Date(existing.lastOrderDate)) {
          existing.name = order.customer_name || existing.name
          existing.phone = order.customer_phone || existing.phone
          existing.lastOrderDate = order.created_at
        }
        if (new Date(order.created_at) < new Date(existing.firstOrderDate)) {
          existing.firstOrderDate = order.created_at
        }
        existing.avgOrderValue = existing.orderCount > 0 ? existing.lifetimeValue / existing.orderCount : 0
      } else {
        // New customer
        const isPaid = order.payment_status === 'paid' && order.status !== 'cancelled'
        customerMap.set(email, {
          email,
          name: order.customer_name || 'N/A',
          phone: order.customer_phone || '',
          orderCount: isPaid ? 1 : 0,
          lifetimeValue: isPaid ? order.total : 0,
          avgOrderValue: isPaid ? order.total : 0,
          firstOrderDate: order.created_at,
          lastOrderDate: order.created_at,
          orders: [order]
        })
      }
    })

    // Convert to array and sort
    let customerList = Array.from(customerMap.values())

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      customerList = customerList.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.phone.includes(query)
      )
    }

    // Sort
    customerList.sort((a, b) => {
      if (sortBy === 'lifetime_value') return b.lifetimeValue - a.lifetimeValue
      if (sortBy === 'order_count') return b.orderCount - a.orderCount
      if (sortBy === 'last_order_date') return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
      return 0
    })

    return customerList
  }, [orders, searchQuery, sortBy])

  const totalCustomers = customers.length
  const repeatCustomers = customers.filter(c => c.orderCount > 1).length
  const totalLifetimeValue = customers.reduce((sum, c) => sum + c.lifetimeValue, 0)

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowDetailModal(true)
  }

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Phone', 'Orders', 'Lifetime Value', 'Avg Order', 'First Order', 'Last Order', 'Repeat']
    const rows = customers.map(c => [
      c.name,
      c.email,
      c.phone,
      c.orderCount,
      c.lifetimeValue.toFixed(2),
      c.avgOrderValue.toFixed(2),
      new Date(c.firstOrderDate).toLocaleDateString(),
      new Date(c.lastOrderDate).toLocaleDateString(),
      c.orderCount > 1 ? 'Yes' : 'No'
    ])

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading customers...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
            Customer Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">Analyze customer behavior and lifetime value</p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 whitespace-nowrap"
        >
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Customers</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{totalCustomers}</div>
        </div>
        <div className="bg-white border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-700">Repeat Customers</div>
          <div className="text-2xl font-bold text-green-700 mt-1">
            {repeatCustomers} ({totalCustomers > 0 ? ((repeatCustomers / totalCustomers) * 100).toFixed(1) : 0}%)
          </div>
        </div>
        <div className="bg-white border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-700">Total Lifetime Value</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">€{totalLifetimeValue.toFixed(2)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)] focus:border-transparent text-sm"
            />
          </div>
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)] text-sm"
            >
              <option value="lifetime_value">Highest Lifetime Value</option>
              <option value="order_count">Most Orders</option>
              <option value="last_order_date">Most Recent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F1E7DA] border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#4B4B4B] uppercase">Customer</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[#4B4B4B] uppercase">Orders</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#4B4B4B] uppercase">Lifetime Value</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#4B4B4B] uppercase hidden lg:table-cell">Avg Order</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[#4B4B4B] uppercase hidden lg:table-cell">Last Order</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#4B4B4B] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const isRepeat = customer.orderCount > 1
                  const daysSinceLastOrder = currentTime
                    ? Math.floor((currentTime - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
                    : 0

                  return (
                    <tr key={customer.email} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {customer.name}
                            {isRepeat && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">
                                Repeat
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">{customer.email}</div>
                          {customer.phone && (
                            <div className="text-xs text-gray-500">{customer.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-lg font-bold text-gray-900">{customer.orderCount}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-lg font-bold text-green-600">
                          €{customer.lifetimeValue.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        <span className="text-sm text-gray-600">€{customer.avgOrderValue.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <span className="text-sm text-gray-600">
                          {daysSinceLastOrder === 0 ? 'Today' : `${daysSinceLastOrder}d ago`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleViewDetails(customer)}
                            className="px-3 py-1.5 text-xs font-medium text-white rounded"
                            style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}
                          >
                            View Details
                          </button>
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
          {customers.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No customers found
            </div>
          ) : (
            customers.map((customer) => {
              const isRepeat = customer.orderCount > 1
              const daysSinceLastOrder = currentTime
                ? Math.floor((currentTime - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
                : 0

              return (
                <div key={customer.email} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {customer.name}
                        {isRepeat && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">
                            Repeat
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{customer.email}</div>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      €{customer.lifetimeValue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span>{customer.orderCount} orders</span>
                    <span>{daysSinceLastOrder === 0 ? 'Today' : `${daysSinceLastOrder}d ago`}</span>
                  </div>
                  <button
                    onClick={() => handleViewDetails(customer)}
                    className="w-full px-3 py-2 text-sm font-medium text-white rounded"
                    style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}
                  >
                    View Details
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Customer Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">{selectedCustomer.name}</h2>
                <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {/* Customer Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600">Total Orders</div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
                    {selectedCustomer.orderCount}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600">Lifetime Value</div>
                  <div className="text-lg sm:text-xl font-bold text-green-600 mt-1">
                    €{selectedCustomer.lifetimeValue.toFixed(2)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600">Avg Order</div>
                  <div className="text-lg sm:text-xl font-bold text-blue-600 mt-1">
                    €{selectedCustomer.avgOrderValue.toFixed(2)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600">Customer Since</div>
                  <div className="text-sm font-semibold text-gray-900 mt-1">
                    {new Date(selectedCustomer.firstOrderDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              {selectedCustomer.phone && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Contact</h3>
                  <p className="text-sm text-gray-600">Phone: {selectedCustomer.phone}</p>
                </div>
              )}

              {/* Order History */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Order History</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[400px]">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Order #</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Total</th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedCustomer.orders
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                {order.order_number}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {new Date(order.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-2 text-sm font-semibold text-right">
                                €{order.total.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                  order.payment_status === 'paid'
                                    ? 'bg-green-100 text-green-700'
                                    : order.payment_status === 'refunded'
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {order.payment_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
