'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  getCart,
  updateCartItemQuantity,
  removeFromCart,
  getCartTotal,
  clearCart,
  CartItem,
} from '@/lib/cart'
import { formatCurrency, checkMinimumOrder } from '@/lib/utils'
import { trackViewCart, trackUpdateCart, trackRemoveFromCart } from '@/lib/analytics'
import { orderRoutes } from '@/lib/routes'
import ErrorMessage from '../components/ErrorMessage'

interface BusinessSettings {
  min_order_value: number
  timezone?: string
  service_types?: string[]
}

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)

  useEffect(() => {
    loadCart()
  }, [])

  useEffect(() => {
    if (!loading && cart.length > 0) {
      const subtotal = getCartTotal(cart)
      const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
      trackViewCart(subtotal, itemCount)
    }
  }, [loading, cart])

  const loadCart = async () => {
    const cartItems = getCart()
    setCart(cartItems)
    
    // Fetch business settings for minimum order check
    try {
      const res = await fetch('/api/business-settings')
      if (res.ok) {
        const settings = await res.json()
        setBusinessSettings(settings)
      }
    } catch (error) {
      console.error('Error fetching business settings:', error)
    }
    
    setLoading(false)
  }

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const updatedCart = updateCartItemQuantity(itemId, quantity)
    setCart(updatedCart)
    
    // Track cart update
    trackUpdateCart(itemId, quantity)
  }

  const handleRemove = (itemId: string) => {
    const item = cart.find((i) => i.id === itemId)
    const updatedCart = removeFromCart(itemId)
    setCart(updatedCart)
    
    // Track removal
    if (item) {
      trackRemoveFromCart(itemId, item.name)
    }
  }

  const subtotal = getCartTotal(cart)
  const minOrder = businessSettings?.min_order_value || 0
  const minOrderCheck = checkMinimumOrder(subtotal, minOrder)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6EF]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9653B] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
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
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="bg-white rounded-xl shadow-lg p-12 max-w-md mx-auto">
            <div className="text-6xl mb-6">🛒</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8">Add some delicious items to get started!</p>
            <Link
              href={orderRoutes.menu()}
              className="inline-block px-8 py-3 bg-[#C9653B] text-white rounded-lg hover:bg-[#B8552B] transition font-semibold"
            >
              Browse Menu
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <header className="bg-[#3A2A24] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href={orderRoutes.menu()} className="flex items-center gap-3 hover:opacity-80 transition">
              <Image src="/logo1.png" alt="Moto Kitchen" width={64} height={64} className="h-12 md:h-16 w-auto object-contain" priority />
            <div className="flex flex-col -ml-2">
              <span className="text-white text-lg md:text-xl leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>Moto Kitchen</span>
              <span className="text-white/80 text-[8px] md:text-[10px] uppercase tracking-[0.15em] leading-tight" style={{ fontFamily: 'var(--font-cinzel)' }}>East African Catering Service</span>
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-10">Your Cart</h1>

        {!minOrderCheck.valid && minOrder > 0 && (
          <div className="mb-6">
            <ErrorMessage
              message={minOrderCheck.message}
              className="bg-yellow-50 border-yellow-200"
            />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 border-b last:border-b-0 gap-4"
            >
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                {item.image_url && (
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image_url}
                      alt={item.name || 'Cart item'}
                      fill
                      className="object-cover"
                      sizes="96px"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{item.name}</h3>
                  <p className="text-sm sm:text-base text-gray-600">{formatCurrency(item.price)} each</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                <div className="flex items-center border-2 border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 min-h-[44px] min-w-[44px] hover:bg-gray-100 transition font-semibold text-gray-700 flex items-center justify-center touch-manipulation"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="px-3 sm:px-4 py-1.5 sm:py-2 min-w-[2.5rem] sm:min-w-[3rem] min-h-[44px] text-center font-medium flex items-center justify-center text-sm sm:text-base">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 min-h-[44px] min-w-[44px] hover:bg-gray-100 transition font-semibold text-gray-700 flex items-center justify-center touch-manipulation"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-base sm:text-lg font-semibold text-gray-900 whitespace-nowrap">
                    {formatCurrency(item.price * item.quantity)}
                  </span>

                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-gray-500 hover:text-gray-700 px-2 sm:px-3 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation text-sm sm:text-base"
                    aria-label="Remove item"
                  >
                    <span className="hidden sm:inline">Remove</span>
                    <span className="sm:hidden">×</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="space-y-4">
            <div className="flex justify-between text-lg">
              <span className="text-gray-600">Items Subtotal</span>
              <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            
            {/* Delivery Fee Information */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-lg">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="text-gray-900">From €5.00*</span>
              </div>
              <p className="text-xs text-gray-500">
                *Delivery fee calculated at checkout based on your postcode
              </p>
            </div>

            {/* Service Fee (if applicable) - currently 0 */}
            {/* <div className="flex justify-between text-lg">
              <span className="text-gray-600">Service Fee</span>
              <span className="font-semibold text-gray-900">{formatCurrency(0)}</span>
            </div> */}

            {/* Minimum Order Warning */}
            {!minOrderCheck.valid && minOrder > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Minimum order:</strong> {formatCurrency(minOrder)}
                  <br />
                  Add {formatCurrency(minOrderCheck.amountNeeded)} more to proceed
                </p>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between text-xl font-semibold mb-2">
                <span>Estimated Total</span>
                <span className="text-[#C9653B]">{formatCurrency(subtotal + 5)}</span>
              </div>
              <p className="text-xs text-gray-500">
                Final total includes delivery fee (calculated at checkout)
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Link
              href={orderRoutes.checkout()}
              className={`block w-full text-center px-6 py-3 min-h-[56px] rounded-lg transition font-semibold flex items-center justify-center touch-manipulation ${
                !minOrderCheck.valid && minOrder > 0
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed pointer-events-none'
                  : 'bg-[#C9653B] text-white hover:bg-[#B8552B]'
              }`}
              onClick={(e) => {
                if (!minOrderCheck.valid && minOrder > 0) {
                  e.preventDefault()
                }
              }}
            >
              {!minOrderCheck.valid && minOrder > 0
                ? `Minimum order not met (${formatCurrency(minOrder)})`
                : 'Proceed to Checkout'}
            </Link>
            <Link
              href={orderRoutes.menu()}
              className="block w-full text-center px-6 py-3 min-h-[56px] border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center touch-manipulation"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

