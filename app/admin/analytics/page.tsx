'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface DailyData {
  date: string
  revenue: number
  orders: number
  avgOrderValue: number
}

interface TopItem {
  name: string
  quantity: number
  revenue: number
  orders: number
}

interface OverviewStats {
  today: {
    revenue: number
    orders: number
    avgOrderValue: number
  }
  period: {
    revenue: number
    orders: number
    avgOrderValue: number
  }
  comparison: {
    revenueChange: number
    ordersChange: number
  }
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  total: number
  subtotal: number
  delivery_fee: number
  status: string
  payment_status: string
  fulfillment_type: string
  created_at: string
  order_items: {
    name_snapshot: string
    quantity: number
    line_total: number
  }[]
}

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'patterns'>('overview')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [mounted, setMounted] = useState(false)

  // Initialize dates on client side only to avoid hydration mismatch
  useEffect(() => {
    if (!mounted) {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      setDateFrom(thirtyDaysAgo.toISOString().split('T')[0])
      setDateTo(now.toISOString().split('T')[0])
      setMounted(true)
    }
  }, [mounted])

  useEffect(() => {
    if (mounted && dateFrom && dateTo) {
      checkAuthAndFetch()
    }
  }, [mounted, dateFrom, dateTo])

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

  // Filter orders by date range and calculate stats
  const analytics = useMemo(() => {
    const fromDate = new Date(dateFrom)
    fromDate.setHours(0, 0, 0, 0)
    const toDate = new Date(dateTo)
    toDate.setHours(23, 59, 59, 999)

    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at)
      return orderDate >= fromDate &&
             orderDate <= toDate &&
             order.status !== 'cancelled' &&
             order.payment_status === 'paid'
    })

    // Today's stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at)
      return orderDate >= today &&
             order.status !== 'cancelled' &&
             order.payment_status === 'paid'
    })

    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0)
    const todayOrderCount = todayOrders.length
    const todayAvg = todayOrderCount > 0 ? todayRevenue / todayOrderCount : 0

    // Period stats
    const periodRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0)
    const periodOrderCount = filteredOrders.length
    const periodAvg = periodOrderCount > 0 ? periodRevenue / periodOrderCount : 0

    // Previous period for comparison
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
    const prevFromDate = new Date(fromDate)
    prevFromDate.setDate(prevFromDate.getDate() - daysDiff)
    const prevToDate = new Date(fromDate)
    prevToDate.setDate(prevToDate.getDate() - 1)

    const prevOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at)
      return orderDate >= prevFromDate &&
             orderDate <= prevToDate &&
             order.status !== 'cancelled' &&
             order.payment_status === 'paid'
    })
    const prevRevenue = prevOrders.reduce((sum, o) => sum + o.total, 0)

    // Daily breakdown
    const dailyMap = new Map<string, { revenue: number; orders: number }>()
    filteredOrders.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0]
      const existing = dailyMap.get(date) || { revenue: 0, orders: 0 }
      dailyMap.set(date, {
        revenue: existing.revenue + order.total,
        orders: existing.orders + 1
      })
    })

    const dailyData: DailyData[] = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
        avgOrderValue: data.orders > 0 ? data.revenue / data.orders : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Top items
    const itemMap = new Map<string, { quantity: number; revenue: number; orders: number }>()
    filteredOrders.forEach(order => {
      order.order_items?.forEach(item => {
        const existing = itemMap.get(item.name_snapshot) || { quantity: 0, revenue: 0, orders: 0 }
        itemMap.set(item.name_snapshot, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.line_total,
          orders: existing.orders + 1
        })
      })
    })

    const topItems: TopItem[] = Array.from(itemMap.entries())
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        revenue: data.revenue,
        orders: data.orders
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Fulfillment breakdown
    const deliveryOrders = filteredOrders.filter(o => o.fulfillment_type === 'delivery')
    const pickupOrders = filteredOrders.filter(o => o.fulfillment_type === 'pickup')

    // Hourly heatmap (day x hour)
    const heatmap: number[][] = Array(7).fill(null).map(() => Array(24).fill(0))
    filteredOrders.forEach(order => {
      const date = new Date(order.created_at)
      const hour = date.getHours()
      const dayOfWeek = date.getDay()
      heatmap[dayOfWeek][hour]++
    })

    return {
      overview: {
        today: {
          revenue: todayRevenue,
          orders: todayOrderCount,
          avgOrderValue: todayAvg
        },
        period: {
          revenue: periodRevenue,
          orders: periodOrderCount,
          avgOrderValue: periodAvg
        },
        comparison: {
          revenueChange: prevRevenue > 0 ? ((periodRevenue - prevRevenue) / prevRevenue) * 100 : 0,
          ordersChange: prevOrders.length > 0 ? ((periodOrderCount - prevOrders.length) / prevOrders.length) * 100 : 0
        }
      },
      dailyData,
      topItems,
      fulfillment: {
        delivery: {
          count: deliveryOrders.length,
          revenue: deliveryOrders.reduce((sum, o) => sum + o.total, 0)
        },
        pickup: {
          count: pickupOrders.length,
          revenue: pickupOrders.reduce((sum, o) => sum + o.total, 0)
        }
      },
      heatmap
    }
  }, [orders, dateFrom, dateTo])

  const handleExport = () => {
    const fromDate = new Date(dateFrom)
    const toDate = new Date(dateTo)
    toDate.setHours(23, 59, 59, 999)

    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at)
      return orderDate >= fromDate && orderDate <= toDate
    })

    const headers = ['Order Number', 'Date', 'Customer', 'Type', 'Subtotal', 'Delivery Fee', 'Total', 'Status', 'Payment']
    const rows = filteredOrders.map(o => [
      o.order_number,
      new Date(o.created_at).toLocaleString(),
      o.customer_name,
      o.fulfillment_type,
      o.subtotal.toFixed(2),
      o.delivery_fee.toFixed(2),
      o.total.toFixed(2),
      o.status,
      o.payment_status
    ])

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${dateFrom}-to-${dateTo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const maxDailyRevenue = Math.max(...analytics.dailyData.map(d => d.revenue), 1)
  const maxHeatmapValue = Math.max(...analytics.heatmap.flat(), 1)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
            Analytics & Reports
          </h1>
          <p className="text-sm text-gray-600 mt-1">Revenue, sales, and performance insights</p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 whitespace-nowrap"
        >
          Export CSV
        </button>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-2">
            <button
              onClick={() => {
                setDateFrom(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
                setDateTo(new Date().toISOString().split('T')[0])
              }}
              className="px-3 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => {
                setDateFrom(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
                setDateTo(new Date().toISOString().split('T')[0])
              }}
              className="px-3 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Last 30 Days
            </button>
            <button
              onClick={() => {
                setDateFrom(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
                setDateTo(new Date().toISOString().split('T')[0])
              }}
              className="px-3 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Last 90 Days
            </button>
          </div>
        </div>
      </div>

      {/* Today's Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-700 font-medium">Today's Revenue</div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-900 mt-2">
            €{analytics.overview.today.revenue.toFixed(2)}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {analytics.overview.today.orders} orders
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-700 font-medium">Period Revenue</div>
          <div className="text-2xl sm:text-3xl font-bold text-green-900 mt-2">
            €{analytics.overview.period.revenue.toFixed(2)}
          </div>
          <div className="text-xs text-green-600 mt-1">
            {analytics.overview.period.orders} orders
            {analytics.overview.comparison.revenueChange !== 0 && (
              <span className={analytics.overview.comparison.revenueChange > 0 ? 'text-green-700 ml-2' : 'text-red-600 ml-2'}>
                {analytics.overview.comparison.revenueChange > 0 ? '+' : ''}{analytics.overview.comparison.revenueChange.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
          <div className="text-sm text-purple-700 font-medium">Avg Order Value</div>
          <div className="text-2xl sm:text-3xl font-bold text-purple-900 mt-2">
            €{analytics.overview.period.avgOrderValue.toFixed(2)}
          </div>
          <div className="text-xs text-purple-600 mt-1">
            For selected period
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {(['overview', 'items', 'patterns'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-[var(--brand-primary,#C9653B)] text-[var(--brand-primary,#C9653B)]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'overview' && 'Revenue Overview'}
                {tab === 'items' && 'Top Selling Items'}
                {tab === 'patterns' && 'Order Patterns'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto">
                  {analytics.dailyData.length === 0 ? (
                    <p className="text-gray-600">No data for selected period</p>
                  ) : (
                    <div className="space-y-2 min-w-[300px]">
                      {analytics.dailyData.slice(-14).map((item) => (
                        <div key={item.date} className="flex items-center gap-2 sm:gap-4">
                          <div className="w-20 sm:w-24 text-xs sm:text-sm text-gray-600 flex-shrink-0">{item.date}</div>
                          <div className="flex-1 min-w-[100px]">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-5 sm:h-6 rounded"
                                style={{
                                  width: `${Math.max(5, (item.revenue / maxDailyRevenue) * 100)}%`,
                                  backgroundColor: 'var(--brand-primary, #C9653B)'
                                }}
                              />
                              <span className="text-xs sm:text-sm font-medium whitespace-nowrap">€{item.revenue.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="w-16 sm:w-20 text-xs sm:text-sm text-gray-600 text-right flex-shrink-0">
                            {item.orders} orders
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Fulfillment Type</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Pickup</span>
                          <span className="text-sm">
                            {analytics.fulfillment.pickup.count} orders • €{analytics.fulfillment.pickup.revenue.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="h-3 rounded-full"
                            style={{
                              width: `${analytics.fulfillment.pickup.count + analytics.fulfillment.delivery.count > 0
                                ? (analytics.fulfillment.pickup.count / (analytics.fulfillment.pickup.count + analytics.fulfillment.delivery.count)) * 100
                                : 0}%`,
                              backgroundColor: 'var(--brand-primary, #C9653B)'
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Delivery</span>
                          <span className="text-sm">
                            {analytics.fulfillment.delivery.count} orders • €{analytics.fulfillment.delivery.revenue.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-500 h-3 rounded-full"
                            style={{
                              width: `${analytics.fulfillment.pickup.count + analytics.fulfillment.delivery.count > 0
                                ? (analytics.fulfillment.delivery.count / (analytics.fulfillment.pickup.count + analytics.fulfillment.delivery.count)) * 100
                                : 0}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Period Summary</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Revenue</span>
                      <span className="text-sm font-semibold">€{analytics.overview.period.revenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Orders</span>
                      <span className="text-sm font-semibold">{analytics.overview.period.orders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Order Value</span>
                      <span className="text-sm font-semibold">€{analytics.overview.period.avgOrderValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Pickup Orders</span>
                      <span className="text-sm font-semibold">{analytics.fulfillment.pickup.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Delivery Orders</span>
                      <span className="text-sm font-semibold">{analytics.fulfillment.delivery.count}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Items Tab */}
          {activeTab === 'items' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Top Selling Items</h3>
              {analytics.topItems.length === 0 ? (
                <p className="text-gray-600">No items sold in selected period</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Qty Sold</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Revenue</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase hidden sm:table-cell">Orders</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {analytics.topItems.map((item, index) => (
                        <tr key={item.name} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
                              index === 0 ? 'bg-yellow-100 text-yellow-700' :
                              index === 1 ? 'bg-gray-100 text-gray-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-50 text-blue-600'
                            }`}>
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 text-sm">{item.name}</td>
                          <td className="px-4 py-3 text-right font-semibold text-sm">{item.quantity}</td>
                          <td className="px-4 py-3 text-right font-semibold text-green-600 text-sm">
                            €{item.revenue.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-600 hidden sm:table-cell">
                            {item.orders}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Patterns Tab */}
          {activeTab === 'patterns' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Peak Ordering Hours</h3>
              <p className="text-sm text-gray-600 mb-4">Darker colors indicate more orders during that hour</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto">
                <table className="w-full border-collapse min-w-[600px]">
                  <thead>
                    <tr>
                      <th className="p-1 sm:p-2 text-xs font-semibold text-gray-600"></th>
                      {Array.from({ length: 24 }, (_, i) => (
                        <th key={i} className="p-0.5 sm:p-1 text-[10px] sm:text-xs font-semibold text-gray-600">
                          {i}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => (
                      <tr key={day}>
                        <td className="p-1 sm:p-2 text-xs font-semibold text-gray-600">{day}</td>
                        {analytics.heatmap[dayIndex].map((value, hourIndex) => {
                          const intensity = maxHeatmapValue > 0 ? (value / maxHeatmapValue) : 0
                          return (
                            <td
                              key={hourIndex}
                              className="p-0.5 sm:p-1 text-center text-[10px] sm:text-xs border border-gray-200"
                              style={{
                                backgroundColor: `rgba(201, 101, 59, ${intensity})`,
                                color: intensity > 0.5 ? 'white' : 'black'
                              }}
                              title={`${day} ${hourIndex}:00 - ${value} orders`}
                            >
                              {value > 0 ? value : ''}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
