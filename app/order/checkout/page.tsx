'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getCart, clearCart, getCartTotal, CartItem, saveCart } from '@/lib/cart'
import { formatCurrency, validateEmail, validatePhone, checkMinimumOrder, getCityFromPostcode } from '@/lib/utils'
import { trackBeginCheckout } from '@/lib/analytics'
import { orderRoutes } from '@/lib/routes'
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
  const submissionRef = useRef(false) // Prevent double submissions

  // Form state
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [postcode, setPostcode] = useState('')
  const [city, setCity] = useState('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedAllergenPolicy, setAcceptedAllergenPolicy] = useState(false)

  const [deliveryFee, setDeliveryFee] = useState(0)
  const [businessSettings, setBusinessSettings] = useState<{ min_order_value: number } | null>(null)

  // Error states
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [networkError, setNetworkError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    validateCartItems()
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
    
    // Backup cart on page unload
    const handleBeforeUnload = () => {
      try {
        const currentCart = getCart()
        if (currentCart.length > 0) {
          saveCart(currentCart)
        }
      } catch (e) {
        // Ignore errors
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeunload', handleBeforeUnload)
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
      
      // Fetch delivery slots after postcode is validated
      if (/^\d{4}[A-Z]{2}$/i.test(postcode.replace(/\s/g, ''))) {
        // Find delivery zone for this postcode
        const postcodePrefix = postcode.substring(0, 4)
        const zone = deliveryZones.find(z => z.postcode_prefix === postcodePrefix)
        const zoneId = zone?.id
        
        // Only fetch if we have a valid delivery zone or if zones aren't required
        if (zone || deliveryZones.length === 0) {
          fetchTimeSlots(zoneId)
        } else {
          // Clear slots if postcode doesn't match any zone
          setTimeSlots([])
          setSelectedTimeSlot('')
        }
      } else {
        // Clear slots if postcode is invalid
        setTimeSlots([])
        setSelectedTimeSlot('')
      }
    } else {
      setDeliveryFee(0)
      // For pickup, fetch slots immediately
      if (fulfillmentType === 'pickup') {
        fetchTimeSlots()
      } else {
        // Clear slots when switching away from delivery
        setTimeSlots([])
        setSelectedTimeSlot('')
      }
    }
  }, [fulfillmentType, postcode, deliveryZones, city, fieldErrors])

  // Derive selectedDate from selectedTimeSlot when time slots are loaded
  useEffect(() => {
    if (selectedTimeSlot && timeSlots.length > 0 && !selectedDate) {
      const slot = timeSlots.find(s => s.id === selectedTimeSlot)
      if (slot) {
        const slotDate = new Date(slot.slot_time)
        const dateKey = slotDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        setSelectedDate(dateKey)
      }
    }
  }, [selectedTimeSlot, timeSlots, selectedDate])

  // Disable scroll restoration and ensure page starts at top
  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0)
    
    // Disable Next.js automatic scroll restoration for this page
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    
    return () => {
      // Re-enable scroll restoration when leaving page
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto'
      }
    }
  }, [])

  // Redirect to cart if empty (must be before any early returns)
  useEffect(() => {
    if (cart.length === 0 && !loading) {
      router.push(orderRoutes.cart())
    }
  }, [cart.length, loading, router])

  const validateCartItems = async () => {
    try {
      const currentCart = getCart()
      if (currentCart.length === 0) {
        setCart([])
        return
      }

      // Fetch all menu items to validate cart items
      const response = await fetch('/api/menu')
      if (!response.ok) {
        // If menu fetch fails, keep cart as is (don't clear it)
        console.warn('Menu validation failed, keeping cart as is')
        setCart(currentCart)
        return
      }

      const menuData = await response.json()
      
      // Get all valid item IDs from menu
      const allItems = menuData.allItems || []
      const validItemIds = new Set(allItems.map((item: any) => item.id))

      // If no valid items found in menu response, don't clear cart (might be a menu API issue)
      if (validItemIds.size === 0) {
        console.warn('No menu items found in API response, keeping cart as is')
        setCart(currentCart)
        return
      }

      // Filter out invalid items
      const validCart = currentCart.filter((item) => validItemIds.has(item.id))
      const removedItems = currentCart.filter((item) => !validItemIds.has(item.id))

      if (removedItems.length > 0) {
        console.warn('Removed invalid cart items:', removedItems)
        // Update cart with only valid items
        if (validCart.length === 0) {
          clearCart()
          setCart([])
        } else {
          // Save valid cart
          saveCart(validCart)
          setCart(validCart)
        }
        
        // Show error about removed items
        setError(`Some items in your cart are no longer available and have been removed. Please add items again.`)
      } else {
        // All items are valid, just set the cart
        setCart(currentCart)
      }
    } catch (error) {
      console.error('Error validating cart:', error)
      // If validation fails, keep the cart as is (don't clear it)
      const currentCart = getCart()
      setCart(currentCart)
    }
  }

  const fetchTimeSlots = async (deliveryZoneId?: string) => {
    try {
      const slotsController = new AbortController()
      const slotsTimeout = setTimeout(() => slotsController.abort(), 10000) // 10 second timeout
      
      try {
        // Build URL with fulfillment_type and optional delivery_zone_id
        const params = new URLSearchParams()
        params.append('fulfillment_type', fulfillmentType)
        if (fulfillmentType === 'delivery' && deliveryZoneId) {
          params.append('delivery_zone_id', deliveryZoneId)
        }
        
        const slotsRes = await fetch(`/api/time-slots?${params.toString()}`, { signal: slotsController.signal })
        clearTimeout(slotsTimeout)
        if (slotsRes.ok) {
          const slots = await slotsRes.json()
          setTimeSlots(slots)
          return slots
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
    } catch (error) {
      console.error('Error fetching time slots:', error)
    }
  }

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

      // Fetch time slots (pickup only at this point, delivery slots fetched after postcode)
      if (fulfillmentType === 'pickup') {
        await fetchTimeSlots()
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

  // Group time slots by date
  const slotsByDate = timeSlots.reduce((acc, slot) => {
    const slotDate = new Date(slot.slot_time)
    const dateKey = slotDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    const dateFull = slotDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    
    if (!acc[dateKey]) {
      acc[dateKey] = { dateFull, slots: [] }
    }
    acc[dateKey].slots.push(slot)
    return acc
  }, {} as Record<string, { dateFull: string; slots: TimeSlot[] }>)

  // Get available times for selected date
  const availableTimes = selectedDate 
    ? slotsByDate[selectedDate]?.slots || []
    : []

  // Get unique dates for chips, sorted chronologically
  const uniqueDates = Object.keys(slotsByDate).sort((a, b) => {
    // Find any slot for each date key to get the timestamp
    const slotA = timeSlots.find(s => {
      const d = s.start_time ? new Date(s.start_time) : new Date(s.slot_time)
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) === a
    })
    const slotB = timeSlots.find(s => {
      const d = s.start_time ? new Date(s.start_time) : new Date(s.slot_time)
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) === b
    })
    if (!slotA || !slotB) return 0
    const timeA = slotA.start_time ? new Date(slotA.start_time).getTime() : new Date(slotA.slot_time).getTime()
    const timeB = slotB.start_time ? new Date(slotB.start_time).getTime() : new Date(slotB.slot_time).getTime()
    return timeA - timeB
  })

  // Form validation function
  const isFormValid = () => {
    return (
      customerName.trim() !== '' &&
      customerEmail.trim() !== '' &&
      validateEmail(customerEmail) &&
      customerPhone.trim() !== '' &&
      validatePhone(customerPhone) &&
      (fulfillmentType === 'pickup' || (deliveryAddress.trim() !== '' && postcode.trim() !== '' && city.trim() !== '')) &&
      selectedTimeSlot !== '' &&
      paymentMethod !== null &&
      acceptedTerms &&
      cart.length > 0 &&
      checkMinimumOrder(getCartTotal(cart), businessSettings?.min_order_value || 0).valid
    )
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
    
    // Validate allergen policy acceptance
    if (!acceptedAllergenPolicy) {
      errors.allergenPolicy = 'You must read and understand the allergen policy to continue'
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
    
    // Prevent double submissions
    if (submissionRef.current || submitting) {
      return
    }
    
    // Clear previous errors
    setError(null)
    setFieldErrors({})
    setNetworkError(null)
    
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

    // Re-validate selected slot is still available
    if (selectedTimeSlot) {
      const selectedSlot = timeSlots.find((s) => s.id === selectedTimeSlot)
      if (!selectedSlot) {
        setError('The selected time slot is no longer available. Please select another slot.')
        // Refresh time slots
        fetchTimeSlots()
        return
      }
      
      // Check if slot is full
      if (selectedSlot.current_orders >= selectedSlot.max_orders) {
        setError('The selected time slot is now full. Please select another slot.')
        // Refresh time slots
        fetchTimeSlots()
        return
      }
    }

    submissionRef.current = true
    setSubmitting(true)

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

      // Create Stripe checkout session
      const response = await fetch('/api/payments/create-session', {
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
        console.error('Stripe session creation error:', JSON.stringify(errorData, null, 2))
        throw new Error(errorData.message || errorData.error || 'Failed to create payment session')
      }

      const { url, sessionId } = await response.json()
      
      if (!url) {
        throw new Error('No checkout URL returned')
      }

      // Clear form backup before redirecting
      localStorage.removeItem('checkout-form-backup')
      
      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (error: any) {
      console.error('Error submitting order:', error)
      
      if (error.name === 'AbortError') {
        setNetworkError('Request timed out. Please check your connection and try again.')
      } else if (error.message?.includes('fetch') || error.name === 'TypeError') {
        setNetworkError('Connection lost. Your form data has been saved. Please check your internet and try again.')
      } else {
        setError(error.message || 'Failed to place order. Please try again.')
      }
      
      submissionRef.current = false
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
    return null
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <header className="bg-[#3A2A24] fixed top-0 left-0 right-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
                    <Link href={orderRoutes.menu()} className="flex items-center gap-3 hover:opacity-80 transition">
              <Image src="/logo1.png" alt="Moto Kitchen" width={64} height={64} className="h-12 md:h-16 w-auto object-contain" priority />
              <div className="flex flex-col -ml-2">
                <span className="text-white text-lg md:text-xl leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>Moto Kitchen</span>
                <span className="text-white/80 text-[8px] md:text-[10px] uppercase tracking-[0.15em] leading-tight" style={{ fontFamily: 'var(--font-cinzel)' }}>East African Catering Service</span>
              </div>
            </Link>
            <Link
                      href={orderRoutes.cart()}
              className="relative px-6 py-2.5 bg-[#C9653B] text-white rounded-lg hover:bg-[#B8552B] transition-all font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden sm:inline">Cart</span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

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
            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fulfillment Type */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Delivery or Pickup?</h2>
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
            <h2 className="text-lg font-semibold mb-4">Your Information</h2>
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
                  className={`w-full px-4 py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent ${
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
                  className={`w-full px-4 py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent ${
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
                  className={`w-full px-4 py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent ${
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
              <h2 className="text-lg font-semibold mb-4">Delivery Address</h2>
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
                    className={`w-full px-4 py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent ${
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
                      className={`w-full px-4 py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent ${
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
                      className={`w-full px-4 py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent ${
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
            <h2 className="text-lg font-semibold mb-4">Select Time Slot *</h2>
            {fulfillmentType === 'pickup' ? (
              <p className="text-sm text-gray-600 mb-4">Choose your pickup window (15 min early/late is fine).</p>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-2">Choose your delivery window.</p>
                <p className="text-sm text-gray-500 mb-4 italic">We deliver within the selected time window. We'll message you when we're on the way.</p>
              </>
            )}
            {fulfillmentType === 'delivery' && (!postcode || !/^\d{4}[A-Z]{2}$/i.test(postcode.replace(/\s/g, ''))) && (
              <p className="text-sm text-amber-600 mb-4">Please enter a valid postcode to see available delivery windows.</p>
            )}
            {fieldErrors.timeSlot && (
              <p className="mb-4 text-sm text-red-600">{fieldErrors.timeSlot}</p>
            )}
            {timeSlots.length === 0 ? (
              <p className="text-gray-600">
                {fulfillmentType === 'delivery' && (!postcode || !/^\d{4}[A-Z]{2}$/i.test(postcode.replace(/\s/g, '')))
                  ? 'Enter a valid postcode to see delivery windows'
                  : 'No available time slots'}
              </p>
            ) : (
              <div className="space-y-4">
                {/* Date Chips - Horizontally Scrollable */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                  <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                    {uniqueDates.map((dateKey) => (
                      <button
                        key={dateKey}
                        type="button"
                        onClick={() => {
                          setSelectedDate(dateKey)
                          setSelectedTimeSlot('') // Clear time selection when date changes
                          if (fieldErrors.timeSlot) {
                            setFieldErrors({ ...fieldErrors, timeSlot: '' })
                          }
                        }}
                        className={`px-4 py-2 rounded-full border flex-shrink-0 transition whitespace-nowrap ${
                          selectedDate === dateKey
                            ? 'border-[#C9653B] bg-[#C9653B] text-white shadow-sm'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-[#C9653B]'
                        }`}
                      >
                        {slotsByDate[dateKey].dateFull}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Chips - Only show when date is selected */}
                {selectedDate && availableTimes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {fulfillmentType === 'delivery' ? 'Select Delivery Window' : 'Select Time'}
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableTimes.map((slot) => {
                        // Use start_time/end_time for delivery windows, fall back to slot_time for pickup/backward compatibility
                        const startTime = slot.start_time 
                          ? new Date(slot.start_time)
                          : new Date(slot.slot_time)
                        const endTime = slot.end_time
                          ? new Date(slot.end_time)
                          : new Date(startTime.getTime() + (slot.duration_minutes || 60) * 60 * 1000)
                        
                        const isFull = slot.current_orders >= slot.max_orders
                        const startTimeStr = startTime.toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                        const endTimeStr = endTime.toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                        
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
                            className={`px-3 py-2 rounded-lg border text-center transition min-h-[44px] ${
                              selectedTimeSlot === slot.id
                                ? 'border-[#C9653B] bg-[#C9653B]/10 text-[#C9653B] font-semibold'
                                : isFull
                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-[#C9653B]'
                            }`}
                          >
                            <div className="text-sm font-medium">
                              {startTimeStr}–{endTimeStr}
                            </div>
                            {isFull && (
                              <div className="text-xs mt-1 text-gray-400">Full</div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Allergen Disclaimer */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Allergen & Dietary Information</h2>
            <p className="text-sm text-gray-700 mb-4">
              Please inform us of any allergies or dietary restrictions. While we take precautions, we cannot guarantee an allergen-free environment. If you have specific dietary requirements, please include them in your order notes or contact us directly.
            </p>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={acceptedAllergenPolicy}
                onChange={(e) => {
                  setAcceptedAllergenPolicy(e.target.checked)
                  if (fieldErrors.allergenPolicy) {
                    setFieldErrors({ ...fieldErrors, allergenPolicy: '' })
                  }
                }}
                className="mt-1 rounded border-gray-300 text-[#C9653B] focus:ring-[#C9653B]"
                required
              />
              <span className="text-sm text-gray-700">
                I have read and understand the allergen policy *
              </span>
            </label>
            {fieldErrors.allergenPolicy && (
              <p className="mt-2 text-sm text-red-600">{fieldErrors.allergenPolicy}</p>
            )}
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Method *</h2>
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

          {/* What Happens Next */}
          <div className="bg-[#FAF6EF] border border-[#E6D9C8] rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#C9653B] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>What happens next:</strong> You&apos;ll receive a confirmation email + {fulfillmentType === 'pickup' ? 'pickup' : 'delivery'} instructions.
                </p>
                <p className="text-xs text-gray-600">
                  Allergens: reply to your confirmation email.
                </p>
              </div>
            </div>
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

          {/* Terms & Conditions - Moved closer to submit button */}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !isFormValid() || submissionRef.current}
            className={`w-full px-6 py-3 min-h-[48px] rounded-lg transition font-semibold text-base touch-manipulation flex items-center justify-center gap-2 ${
              isFormValid() && !submitting && !submissionRef.current
                ? 'bg-[#C9653B] text-white hover:bg-[#B8552B]'
                : 'bg-gray-400 opacity-60 text-white cursor-not-allowed'
            }`}
            aria-label={submitting ? 'Placing order...' : `Pay ${formatCurrency(total)} & place order`}
          >
            {submitting && (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {submitting 
              ? 'Placing Order...' 
              : `Pay ${formatCurrency(total)} & Place Order`}
          </button>
        </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-[73px] bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
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

