'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Order } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const orderNumber = searchParams.get('orderNumber')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId)
    } else {
      setLoading(false)
    }
  }, [orderId])

  const fetchOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/orders/${id}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6EF]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9653B] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <header className="bg-[#3A2A24] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/order" className="flex items-center gap-3 hover:opacity-80 transition">
            <img src="/logo1.png" alt="Moto Kitchen" className="h-12 md:h-16 object-contain" />
            <div className="flex flex-col -ml-2">
              <span className="text-white text-lg md:text-xl leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>Moto Kitchen</span>
              <span className="text-white/80 text-[8px] md:text-[10px] uppercase tracking-[0.15em] leading-tight" style={{ fontFamily: 'var(--font-cinzel)' }}>East African Catering Service</span>
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order Confirmed!
            </h1>
            <p className="text-gray-600">
              Thank you for your order. We've received it and will prepare it soon.
            </p>
          </div>

          {order && (
            <div className="text-left bg-[#FAF6EF] rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Order Details</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-semibold">{order.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-semibold">{order.customer_name}</span>
                </div>
                {order.scheduled_for && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Scheduled for:</span>
                    <span className="font-semibold">
                      {formatDate(order.scheduled_for)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-semibold capitalize">
                    {order.fulfillment_type}
                  </span>
                </div>
                {order.fulfillment_type === 'delivery' && order.delivery_address && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-gray-600 mb-1">Delivery Address:</div>
                    <div className="font-semibold">
                      {order.delivery_address}
                      <br />
                      {order.postcode} {order.city}
                    </div>
                  </div>
                )}
                {order.order_items && order.order_items.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-gray-600 mb-2">Items:</div>
                    <div className="space-y-1">
                      {order.order_items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>
                            {item.name_snapshot} × {item.quantity}
                          </span>
                          <span>{formatCurrency(item.line_total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-[#C9653B]">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {orderNumber && !order && (
            <div className="text-left bg-[#FAF6EF] rounded-xl p-6 mb-6">
              <p className="font-semibold">Order Number: {orderNumber}</p>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/order"
              className="block w-full px-6 py-3 bg-[#C9653B] text-white rounded-lg hover:bg-[#B8552B] transition font-semibold"
            >
              Order Again
            </Link>
            <Link
              href="/order"
              className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Back to Menu
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}

