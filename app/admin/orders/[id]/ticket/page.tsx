'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface OrderItem {
  id: string
  name_snapshot: string
  quantity: number
  unit_price: number
  line_total: number
  notes: string | null
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string | null
  customer_phone: string
  fulfillment_type: 'pickup' | 'delivery'
  scheduled_for: string | null
  delivery_address: string | null
  postcode: string | null
  city: string | null
  subtotal: number
  delivery_fee: number
  total: number
  notes: string | null
  admin_notes: string | null
  order_items: OrderItem[]
}

export default function KitchenTicketPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
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

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled'
    const date = new Date(dateString)
    return date.toLocaleString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading ticket...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Order not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Print-only header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Kitchen Ticket</h1>
        <p className="text-sm text-gray-600">Printed: {new Date().toLocaleString()}</p>
      </div>

      {/* Screen-only controls */}
      <div className="print:hidden mb-6 flex gap-4">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-[#C9653B] text-white rounded hover:bg-[#B8552B]"
        >
          Print Ticket
        </button>
        <Link
          href="/admin/orders"
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Back to Orders
        </Link>
      </div>

      {/* Ticket Content */}
      <div className="max-w-2xl mx-auto bg-white border-2 border-gray-800 p-8">
        {/* Order Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <div className="text-2xl font-bold text-gray-900 mb-2">
            Order #{order.order_number}
          </div>
          <div className="text-lg text-gray-600">
            {formatDateTime(order.scheduled_for)}
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-6 pb-4 border-b border-gray-300">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Customer</h2>
          <div className="space-y-1 text-sm">
            <div><strong>Name:</strong> {order.customer_name}</div>
            {order.customer_phone && (
              <div><strong>Phone:</strong> {order.customer_phone}</div>
            )}
            {order.customer_email && (
              <div><strong>Email:</strong> {order.customer_email}</div>
            )}
          </div>
        </div>

        {/* Fulfillment Info */}
        <div className="mb-6 pb-4 border-b border-gray-300">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {order.fulfillment_type === 'pickup' ? 'Pickup' : 'Delivery'}
          </h2>
          {order.fulfillment_type === 'delivery' && order.delivery_address && (
            <div className="text-sm">
              <div><strong>Address:</strong> {order.delivery_address}</div>
              {(order.postcode || order.city) && (
                <div>
                  <strong>Location:</strong> {order.postcode} {order.city}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="mb-6 pb-4 border-b border-gray-300">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Items</h2>
          <div className="space-y-3">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-lg">
                    {item.name_snapshot} × {item.quantity}
                  </div>
                  {item.notes && (
                    <div className="text-sm text-gray-600 italic mt-1">
                      Note: {item.notes}
                    </div>
                  )}
                </div>
                <div className="text-lg font-semibold ml-4">
                  {formatCurrency(item.line_total)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Special Notes */}
        {order.notes && (
          <div className="mb-6 pb-4 border-b border-gray-300">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Customer Notes</h2>
            <p className="text-sm bg-yellow-50 p-3 border border-yellow-200 rounded">
              {order.notes}
            </p>
          </div>
        )}

        {/* Internal Notes */}
        {order.admin_notes && (
          <div className="mb-6 pb-4 border-b border-gray-300">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Internal Notes</h2>
            <p className="text-sm bg-blue-50 p-3 border border-blue-200 rounded">
              {order.admin_notes}
            </p>
          </div>
        )}

        {/* Order Summary */}
        <div className="mt-6 pt-4 border-t-2 border-gray-800">
          <div className="flex justify-between text-lg mb-2">
            <span>Subtotal:</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.delivery_fee > 0 && (
            <div className="flex justify-between text-lg mb-2">
              <span>Delivery Fee:</span>
              <span>{formatCurrency(order.delivery_fee)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-300">
            <span>Total:</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  )
}

