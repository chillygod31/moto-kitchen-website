'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getCart, clearCart, getCartTotal, CartItem } from '@/lib/cart'
import { formatCurrency, validateEmail, validatePhone, checkMinimumOrder, getCityFromPostcode } from '@/lib/utils'
import { trackBeginCheckout } from '@/lib/analytics'
import ErrorMessage from '../components/ErrorMessage'
import NetworkError from '../components/NetworkError'
import PaymentMethodSelector from '../components/PaymentMethodSelector'

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
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const [deliveryFee, setDeliveryFee] = useState(0)
  const [businessSettings, setBusinessSettings] = useState<{ min_order_value: number } | null>(null)

  // Error states
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [networkError, setNetworkError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    loadData()
    
    // Restore form data from backup if available
    try {
      const backup = localStorage.getItem('checkout-form-backup')
      if (backup) {
        const formData = JSON.parse(backup)
        setCustomerName(formData.customerName || '')
        setCustomerEmail(formData.customerEmail || '')
        setCustomerPhone(formData.customerPhone || '')
        setFulfillmentType(formData.fulfillmentType || 'pickup')
        setDeliveryAddress(formData.deliveryAddress || '')
        setPostcode(formData.postcode || '')
        setCity(formData.city || '')
        setSelectedTimeSlot(formData.selectedTimeSlot || '')
        setNotes(formData.notes || '')
      }
    } catch (e) {
      // Ignore errors
    }
    
    // Monitor online/offline status
    const handleOnline = () => {
      setIsOffline(false)
      if (networkError) {
        setNetworkError(null)
      }
    }
    
    const handleOffline = () => {
      setIsOffline(true)
      setNetworkError('You appear to be offline. Please check your internet connection.')
    }
    
    setIsOffline(!navigator.onLine)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (fulfillmentType === 'delivery' && postcode) {
      calculateDeliveryFee()
      
      // Auto-fill city from postcode
      const autoFillCity = async () => {
        if (postcode && /^\d{4}[A-Z]{2}$/i.test(postcode.replace(/\s/g, ''))) {
          try {
            const detectedCity = await getCityFromPostcode(postcode)
            if (detectedCity && (!city || city.trim() === '')) {
              setCity(detectedCity)
              if (fieldErrors.city) {
                setFieldErrors({ ...fieldErrors, city: '' })
              }
            }
          } catch (error) {
            // Silently fail - user can manually enter city
            console.error('Error auto-filling city:', error)
          }
        }
      }
      autoFillCity()
    } else {
      setDeliveryFee(0)
    }
  }, [fulfillmentType, postcode, deliveryZones, city, fieldErrors])

  // Scroll input into view on mobile when focused
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Delay scroll to ensure keyboard has appeared
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 300)
      }
    }

    window.addEventListener('focusin', handleFocus)
    return () => window.removeEventListener('focusin', handleFocus)
  }, [])

  const loadData = async () => {
    const cartItems = getCart()
    setCart(cartItems)

    // Track begin checkout
    if (cartItems.length > 0) {
      const subtotal = getCartTotal(cartItems)
      const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
      trackBeginCheckout(subtotal, itemCount)
    }

    try {
      // Check if offline
      if (!navigator.onLine) {
        setNetworkError('You appear to be offline. Please check your internet connection.')
        setLoading(false)
        return
      }

      // Fetch time slots with timeout
      const slotsController = new AbortController()
      const slotsTimeout = setTimeout(() => slotsController.abort(), 10000) // 10 second timeout
      
      try {
        const slotsRes = await fetch('/api/time-slots', { signal: slotsController.signal })
        clearTimeout(slotsTimeout)
        if (slotsRes.ok) {
          const slots = await slotsRes.json()
          setTimeSlots(slots)
        } else if (!slotsRes.ok) {
          throw new Error('Failed to load time slots')
        }
      } catch (err: any) {
        clearTimeout(slotsTimeout)
        if (err.name === 'AbortError') {
          setNetworkError('Request timed out. Please check your connection and try again.')
        } else {
          throw err
        }
      }

      // Fetch delivery zones
      const zonesRes = await fetch('/api/delivery-zones')
      if (zonesRes.ok) {
        const zones = await zonesRes.json()
        setDeliveryZones(zones)
      }

      // Fetch business settings for minimum order check
      const settingsRes = await fetch('/api/business-settings')
      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        setBusinessSettings(settings)
      }
    } catch (error: any) {
      console.error('Error loading data:', error)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setNetworkError('Connection lost. Please check your internet and try again.')
      } else {
        setNetworkError('Failed to load checkout data. Please try again.')
      }
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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    // Check minimum order first
    const subtotal = getCartTotal(cart)
    const minOrderValue = businessSettings?.min_order_value || 0
    if (minOrderValue > 0) {
      const minOrderCheck = checkMinimumOrder(subtotal, minOrderValue)
      if (!minOrderCheck.valid) {
        errors.minOrder = minOrderCheck.message
      }
    }
    
    // Validate name
    if (!customerName.trim()) {
      errors.customerName = 'Name is required'
    }
    
    // Validate email
    if (!customerEmail.trim()) {
      errors.customerEmail = 'Email is required'
    } else if (!validateEmail(customerEmail)) {
      errors.customerEmail = 'Please enter a valid email address'
    }
    
    // Validate phone
    if (!customerPhone.trim()) {
      errors.customerPhone = 'Phone number is required'
    } else if (!validatePhone(customerPhone)) {
      errors.customerPhone = 'Please enter a valid Dutch phone number (e.g., +31 6 1234 5678 or 06 1234 5678)'
    }
    
    // Validate delivery address if delivery selected
    if (fulfillmentType === 'delivery') {
      if (!deliveryAddress.trim()) {
        errors.deliveryAddress = 'Delivery address is required'
      }
      if (!postcode.trim()) {
        errors.postcode = 'Postcode is required'
      } else if (!/^\d{4}[A-Z]{2}$/i.test(postcode.trim())) {
        errors.postcode = 'Please enter a valid Dutch postcode (e.g., 1012AB)'
      }
      if (!city.trim()) {
        errors.city = 'City is required'
      }
    }
    
    // Validate time slot
    if (!selectedTimeSlot) {
      errors.timeSlot = 'Please select a time slot'
    }
    
    // Validate payment method
    if (!paymentMethod) {
      errors.paymentMethod = 'Please select a payment method'
    }
    
    // Validate terms acceptance
    if (!acceptedTerms) {
      errors.terms = 'You must accept the Terms & Conditions to continue'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setError(null)
    setFieldErrors({})
    
    // Validate form
    if (!validateForm()) {
      setError('Please fix the errors below')
      return
    }

    // Check if offline before submitting
    if (!navigator.onLine) {
      setNetworkError('You appear to be offline. Please check your internet connection and try again.')
      return
    }

    setSubmitting(true)
    setNetworkError(null)

    // Save form data to localStorage as backup
    try {
      localStorage.setItem('checkout-form-backup', JSON.stringify({
        customerName,
        customerEmail,
        customerPhone,
        fulfillmentType,
        deliveryAddress,
        postcode,
        city,
        selectedTimeSlot,
        notes,
      }))
    } catch (e) {
      // Ignore localStorage errors
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
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

      clearTimeout(timeout)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }))
        throw new Error(errorData.message || 'Failed to create order')
      }

      const order = await response.json()
      
      // Clear form backup on success
      localStorage.removeItem('checkout-form-backup')
      
      clearCart()
      router.push(`/order/order-success?orderId=${order.id}&orderNumber=${order.order_number}`)
    } catch (error: any) {
      console.error('Error submitting order:', error)
      
      if (error.name === 'AbortError') {
        setNetworkError('Request timed out. Please check your connection and try again.')
      } else if (error.message?.includes('fetch') || error.name === 'TypeError') {
        setNetworkError('Connection lost. Your form data has been saved. Please check your internet and try again.')
      } else {
        setError(error.message || 'Failed to place order. Please try again.')
      }
      
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EF]">
        <header className="bg-[#3A2A24] shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="h-16 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="h-10 bg-gray-200 rounded w-32 mb-10 animate-pulse"></div>
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg p-6 space-y-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="space-y-3">
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (cart.length === 0) {
    router.push('/order/cart')
    return null
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-10">Checkout</h1>

        {(error || networkError) && (
          <div className="mb-6">
            {networkError ? (
              <NetworkError
                message={networkError}
                onRetry={() => {
                  setNetworkError(null)
                  if (isOffline) {
                    loadData()
                  } else {
                    handleSubmit(new Event('submit') as any)
                  }
                }}
                onDismiss={() => setNetworkError(null)}
              />
            ) : (
              <ErrorMessage message={error!} onDismiss={() => setError(null)} />
            )}
          </div>
        )}

        {fieldErrors.minOrder && (
          <div className="mb-6">
            <ErrorMessage message={fieldErrors.minOrder} />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
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
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  id="customerName"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value)
                    if (fieldErrors.customerName) {
                      setFieldErrors({ ...fieldErrors, customerName: '' })
                    }
                  }}
                  className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent ${
                    fieldErrors.customerName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  aria-invalid={!!fieldErrors.customerName}
                  aria-describedby={fieldErrors.customerName ? 'customerName-error' : undefined}
                />
                {fieldErrors.customerName && (
                  <p id="customerName-error" className="mt-1 text-sm text-red-600" role="alert">{fieldErrors.customerName}</p>
                )}
              </div>
              <div>
                <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  id="customerEmail"
                  type="email"
                  required
                  autoComplete="email"
                  value={customerEmail}
                  onChange={(e) => {
                    setCustomerEmail(e.target.value)
                    if (fieldErrors.customerEmail) {
                      setFieldErrors({ ...fieldErrors, customerEmail: '' })
                    }
                  }}
                  className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent ${
                    fieldErrors.customerEmail ? 'border-red-300' : 'border-gray-300'
                  }`}
                  aria-invalid={!!fieldErrors.customerEmail}
                  aria-describedby={fieldErrors.customerEmail ? 'customerEmail-error' : undefined}
                />
                {fieldErrors.customerEmail && (
                  <p id="customerEmail-error" className="mt-1 text-sm text-red-600" role="alert">{fieldErrors.customerEmail}</p>
                )}
              </div>
              <div>
                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  id="customerPhone"
                  type="tel"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value)
                    if (fieldErrors.customerPhone) {
                      setFieldErrors({ ...fieldErrors, customerPhone: '' })
                    }
                  }}
                  className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent ${
                    fieldErrors.customerPhone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="+31 6 1234 5678 or 06 1234 5678"
                  aria-invalid={!!fieldErrors.customerPhone}
                  aria-describedby={fieldErrors.customerPhone ? 'customerPhone-error' : undefined}
                />
                {fieldErrors.customerPhone && (
                  <p id="customerPhone-error" className="mt-1 text-sm text-red-600" role="alert">{fieldErrors.customerPhone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          {fulfillmentType === 'delivery' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="deliveryAddress" className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    id="deliveryAddress"
                    type="text"
                    required
                    autoComplete="street-address"
                    value={deliveryAddress}
                    onChange={(e) => {
                      setDeliveryAddress(e.target.value)
                      if (fieldErrors.deliveryAddress) {
                        setFieldErrors({ ...fieldErrors, deliveryAddress: '' })
                      }
                    }}
                    className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent ${
                      fieldErrors.deliveryAddress ? 'border-red-300' : 'border-gray-300'
                    }`}
                    aria-invalid={!!fieldErrors.deliveryAddress}
                    aria-describedby={fieldErrors.deliveryAddress ? 'deliveryAddress-error' : undefined}
                  />
                  {fieldErrors.deliveryAddress && (
                    <p id="deliveryAddress-error" className="mt-1 text-sm text-red-600" role="alert">{fieldErrors.deliveryAddress}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">
                      Postcode *
                    </label>
                    <input
                      id="postcode"
                      type="text"
                      required
                      autoComplete="postal-code"
                      inputMode="text"
                      value={postcode}
                      onChange={(e) => {
                        setPostcode(e.target.value.toUpperCase())
                        if (fieldErrors.postcode) {
                          setFieldErrors({ ...fieldErrors, postcode: '' })
                        }
                      }}
                      className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent ${
                        fieldErrors.postcode ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="1012AB"
                      aria-invalid={!!fieldErrors.postcode}
                      aria-describedby={fieldErrors.postcode ? 'postcode-error' : undefined}
                    />
                    {fieldErrors.postcode && (
                      <p id="postcode-error" className="mt-1 text-sm text-red-600" role="alert">{fieldErrors.postcode}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      id="city"
                      type="text"
                      required
                      autoComplete="address-level2"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value)
                        if (fieldErrors.city) {
                          setFieldErrors({ ...fieldErrors, city: '' })
                        }
                      }}
                      className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent ${
                        fieldErrors.city ? 'border-red-300' : 'border-gray-300'
                      }`}
                      aria-invalid={!!fieldErrors.city}
                      aria-describedby={fieldErrors.city ? 'city-error' : undefined}
                    />
                    {fieldErrors.city && (
                      <p id="city-error" className="mt-1 text-sm text-red-600" role="alert">{fieldErrors.city}</p>
                    )}
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
            <h2 className="text-xl font-semibold mb-4">Select Time Slot *</h2>
            {fieldErrors.timeSlot && (
              <p className="mb-4 text-sm text-red-600">{fieldErrors.timeSlot}</p>
            )}
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
                      onClick={() => {
                        setSelectedTimeSlot(slot.id)
                        if (fieldErrors.timeSlot) {
                          setFieldErrors({ ...fieldErrors, timeSlot: '' })
                        }
                      }}
                      disabled={isFull}
                      className={`p-3 border-2 rounded-lg text-left transition ${
                        selectedTimeSlot === slot.id
                          ? 'border-[#C9653B] bg-[#C9653B] text-white'
                          : isFull
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : fieldErrors.timeSlot
                          ? 'border-red-300 hover:border-[#C9653B]'
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

          {/* Payment Method Selection */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Method *</h2>
            {fieldErrors.paymentMethod && (
              <p className="mb-4 text-sm text-red-600">{fieldErrors.paymentMethod}</p>
            )}
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onSelect={(method) => {
                setPaymentMethod(method)
                if (fieldErrors.paymentMethod) {
                  setFieldErrors({ ...fieldErrors, paymentMethod: '' })
                }
              }}
            />
          </div>

          {/* Terms & Conditions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <label className="flex items-start gap-3 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked)
                  if (fieldErrors.terms) {
                    setFieldErrors({ ...fieldErrors, terms: '' })
                  }
                }}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-[#C9653B] focus:ring-[#C9653B]"
              />
              <div className="flex-1">
                <span className="text-sm text-gray-700">
                  I agree to the{' '}
                  <Link href="/terms" target="_blank" className="text-[#C9653B] hover:underline">
                    Terms & Conditions
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" target="_blank" className="text-[#C9653B] hover:underline">
                    Privacy Policy
                  </Link>
                  {' '}*
                </span>
                {fieldErrors.terms && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.terms}</p>
                )}
              </div>
            </label>
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !selectedTimeSlot || !paymentMethod || !acceptedTerms}
            className="w-full px-6 py-4 min-h-[56px] bg-[#C9653B] text-white rounded-lg hover:bg-[#B8552B] transition font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed touch-manipulation"
            aria-label={submitting ? 'Placing order...' : 'Place order'}
          >
            {submitting ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-[73px] bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="flex-1">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="ml-2 font-medium">{formatCurrency(item.price * item.quantity)}</span>
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
                <div className="flex justify-between text-xl font-bold border-t pt-2 mt-2">
                  <span>Total</span>
                  <span className="text-[#C9653B]">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

