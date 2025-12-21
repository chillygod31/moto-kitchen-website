'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Order } from '@/types'
import { formatCurrency, formatDate, copyToClipboard, getGoogleMapsUrl } from '@/lib/utils'
import { trackPurchase } from '@/lib/analytics'
import OrderTimeline from '../components/OrderTimeline'

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const orderNumber = searchParams.get('orderNumber')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [businessSettings, setBusinessSettings] = useState<any>(null)
  const [copiedAddress, setCopiedAddress] = useState(false)

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
        
        // Track purchase
        if (data && data.order_items) {
          trackPurchase(
            data.order_number || data.id,
            data.total || 0,
            data.order_items.map((item: any) => ({
              item_id: item.menu_item_id || item.id,
              item_name: item.name_snapshot || 'Unknown',
              price: item.unit_price || item.price || 0,
              quantity: item.quantity || 1,
            }))
          )
        }
      }

      // Fetch business settings for contact info and lead time
      const settingsRes = await fetch('/api/business-settings')
      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        setBusinessSettings(settings)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyAddress = async () => {
    if (order?.fulfillment_type === 'pickup' && businessSettings) {
      // For pickup, use business address
      const address = `${businessSettings.pickup_address || 'Galjootstraat 6-B'}, ${businessSettings.pickup_postcode || '3028 VL'} ${businessSettings.pickup_city || 'Rotterdam'}`
      await copyToClipboard(address)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    } else if (order?.fulfillment_type === 'delivery' && order.delivery_address) {
      const address = `${order.delivery_address}, ${order.postcode} ${order.city}`
      await copyToClipboard(address)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
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
      <header className="bg-[#3A2A24] sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/order" className="flex items-center gap-3 hover:opacity-80 transition">
            <Image src="/logo1.png" alt="Moto Kitchen" width={64} height={64} className="h-12 md:h-16 w-auto object-contain" priority />
            <div className="flex flex-col -ml-2">
              <span className="text-white text-lg md:text-xl leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>Moto Kitchen</span>
              <span className="text-white/80 text-[8px] md:text-[10px] uppercase tracking-[0.15em] leading-tight" style={{ fontFamily: 'var(--font-cinzel)' }}>East African Catering Service</span>
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
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
            {order?.customer_email && (
              <p className="text-sm text-gray-500 mt-2">
                Confirmation sent to {order.customer_email}
              </p>
            )}
          </div>

          {order && (
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Order Timeline */}
              <div>
                <OrderTimeline
                  orderNumber={order.order_number || orderNumber || ''}
                  scheduledFor={order.scheduled_for || null}
                  leadTimeMinutes={businessSettings?.lead_time_minutes || 120}
                />
              </div>

              {/* Order Details */}
              <div>
                <div className="text-left bg-[#FAF6EF] rounded-xl p-6">
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
                {/* Pickup Location */}
                {order.fulfillment_type === 'pickup' && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-gray-600 mb-2">📍 Pickup Location:</div>
                    <div className="font-semibold mb-3">
                      {businessSettings?.pickup_address || 'Galjootstraat 6-B'}
                      <br />
                      {businessSettings?.pickup_postcode || '3028 VL'} {businessSettings?.pickup_city || 'Rotterdam'}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyAddress}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium min-h-[44px] touch-manipulation"
                      >
                        {copiedAddress ? '✓ Copied!' : '📋 Copy Address'}
                      </button>
                      <a
                        href={getGoogleMapsUrl(`${businessSettings?.pickup_address || 'Galjootstraat 6-B'}, ${businessSettings?.pickup_postcode || '3028 VL'} ${businessSettings?.pickup_city || 'Rotterdam'}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-[#C9653B] text-white rounded-lg hover:bg-[#B8552B] transition text-sm font-medium min-h-[44px] flex items-center justify-center touch-manipulation"
                      >
                        🗺️ Get Directions
                      </a>
                    </div>
                  </div>
                )}

                {/* Delivery Address */}
                {order.fulfillment_type === 'delivery' && order.delivery_address && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-gray-600 mb-1">📍 Delivery Address:</div>
                    <div className="font-semibold mb-3">
                      {order.delivery_address}
                      <br />
                      {order.postcode} {order.city}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyAddress}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium min-h-[44px] touch-manipulation"
                      >
                        {copiedAddress ? '✓ Copied!' : '📋 Copy Address'}
                      </button>
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
              </div>
            </div>
          )}

          {orderNumber && !order && (
            <div className="text-left bg-[#FAF6EF] rounded-xl p-6 mb-8">
              <p className="font-semibold">Order Number: {orderNumber}</p>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-[#FAF6EF] rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Questions about your order?</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <a
                  href="https://wa.me/31612345678"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C9653B] hover:underline"
                >
                  📱 WhatsApp: +31 6 1234 5678
                </a>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a
                  href="mailto:info@motokitchen.nl"
                  className="text-[#C9653B] hover:underline"
                >
                  ✉️ Email: info@motokitchen.nl
                </a>
              </div>
              {businessSettings?.business_hours && (
                <div className="flex items-start gap-3 mt-3 pt-3 border-t">
                  <svg className="w-5 h-5 text-gray-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-700">We're here:</p>
                    <p className="text-sm text-gray-600">
                      {typeof businessSettings.business_hours === 'string'
                        ? businessSettings.business_hours
                        : 'Check our website for hours'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <Link
              href="/contact"
              className="inline-block mt-4 px-6 py-2 bg-[#C9653B] text-white rounded-lg hover:bg-[#B8552B] transition font-semibold text-sm min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              Contact Us
            </Link>
          </div>

          <div className="space-y-3">
            <Link
              href="/order"
              className="block w-full text-center px-6 py-3 bg-[#C9653B] text-white rounded-lg hover:bg-[#B8552B] transition font-semibold min-h-[56px] flex items-center justify-center touch-manipulation"
            >
              Order Again
            </Link>
            <Link
              href="/order"
              className="block w-full text-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition min-h-[56px] flex items-center justify-center touch-manipulation"
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

