'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCart, clearCart, getCartTotal, CartItem } from '@/lib/cart'
import { formatCurrency } from '@/lib/utils'

interface TimeSlot {
  id: string
  slot_time: string
  max_orders: number
  current_orders: number
}

interface DeliveryZone {
  id: string
  name: string
  postcode_prefix: string | null
  fee: number
  min_order: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [postcode, setPostcode] = useState('')
  const [city, setCity] = useState('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('')
  const [notes, setNotes] = useState('')

  const [deliveryFee, setDeliveryFee] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (fulfillmentType === 'delivery' && postcode) {
      calculateDeliveryFee()
    } else {
      setDeliveryFee(0)
    }
  }, [fulfillmentType, postcode, deliveryZones])

  const loadData = async () => {
    const cartItems = getCart()
    setCart(cartItems)

    try {
      // Fetch time slots
      const slotsRes = await fetch('/api/time-slots')
      if (slotsRes.ok) {
        const slots = await slotsRes.json()
        setTimeSlots(slots)
      }

      // Fetch delivery zones
      const zonesRes = await fetch('/api/delivery-zones')
      if (zonesRes.ok) {
        const zones = await zonesRes.json()
        setDeliveryZones(zones)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDeliveryFee = () => {
    if (!postcode || deliveryZones.length === 0) {
      setDeliveryFee(0)
      return
    }

    const prefix = postcode.match(/^(\d{1,2})/)?.[1]
    if (!prefix) {
      setDeliveryFee(0)
      return
    }

    const matchingZone = deliveryZones.find(
      (zone) => zone.postcode_prefix === prefix
    )

    if (matchingZone) {
      setDeliveryFee(matchingZone.fee)
    } else {
      // Default fee if no zone matches
      setDeliveryFee(10)
    }
  }

  const subtotal = getCartTotal(cart)
  const total = subtotal + deliveryFee

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTimeSlot) {
      alert('Please select a time slot')
      return
    }

    if (fulfillmentType === 'delivery' && (!deliveryAddress || !postcode || !city)) {
      alert('Please fill in delivery address')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          fulfillmentType,
          deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress : null,
          postcode: fulfillmentType === 'delivery' ? postcode : null,
          city: fulfillmentType === 'delivery' ? city : null,
          scheduledFor: timeSlots.find((s) => s.id === selectedTimeSlot)?.slot_time,
          cartItems: cart,
          subtotal,
          deliveryFee,
          serviceFee: 0,
          adminFee: 0,
          total,
          notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create order')
      }

      const order = await response.json()
      clearCart()
      router.push(`/order/order-success?orderId=${order.id}&orderNumber=${order.order_number}`)
    } catch (error: any) {
      console.error('Error submitting order:', error)
      alert(error.message || 'Failed to place order. Please try again.')
      setSubmitting(false)
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

  if (cart.length === 0) {
    router.push('/order/cart')
    return null
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-10">Checkout</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Fulfillment Type */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Delivery or Pickup?</h2>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="fulfillmentType"
                  value="pickup"
                  checked={fulfillmentType === 'pickup'}
                  onChange={(e) => setFulfillmentType(e.target.value as 'pickup')}
                  className="mr-2"
                />
                Pickup
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="fulfillmentType"
                  value="delivery"
                  checked={fulfillmentType === 'delivery'}
                  onChange={(e) => setFulfillmentType(e.target.value as 'delivery')}
                  className="mr-2"
                />
                Delivery
              </label>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Your Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          {fulfillmentType === 'delivery' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postcode *
                    </label>
                    <input
                      type="text"
                      required
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent"
                    />
                  </div>
                </div>
                {deliveryFee > 0 && (
                  <p className="text-sm text-gray-600">
                    Delivery fee: {formatCurrency(deliveryFee)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Time Slot Selection */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Select Time Slot</h2>
            {timeSlots.length === 0 ? (
              <p className="text-gray-600">No available time slots</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {timeSlots.map((slot) => {
                  const slotDate = new Date(slot.slot_time)
                  const isFull = slot.current_orders >= slot.max_orders
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedTimeSlot(slot.id)}
                      disabled={isFull}
                      className={`p-3 border-2 rounded-lg text-left transition ${
                        selectedTimeSlot === slot.id
                          ? 'border-[#C9653B] bg-[#C9653B] text-white'
                          : isFull
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 hover:border-[#C9653B]'
                      }`}
                    >
                      <div className="font-medium">
                        {slotDate.toLocaleDateString('nl-NL', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                      <div className="text-sm">
                        {slotDate.toLocaleTimeString('nl-NL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      {isFull && <div className="text-xs mt-1">Full</div>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent"
            />
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold border-t pt-2">
                <span>Total</span>
                <span className="text-[#C9653B]">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !selectedTimeSlot}
            className="w-full px-6 py-4 bg-[#C9653B] text-white rounded-lg hover:bg-[#B8552B] transition font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>
      </main>
    </div>
  )
}

