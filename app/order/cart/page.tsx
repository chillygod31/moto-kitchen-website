'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  getCart,
  updateCartItemQuantity,
  removeFromCart,
  getCartTotal,
  clearCart,
  CartItem,
} from '@/lib/cart'
import { formatCurrency } from '@/lib/utils'

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = () => {
    const cartItems = getCart()
    setCart(cartItems)
    setLoading(false)
  }

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const updatedCart = updateCartItemQuantity(itemId, quantity)
    setCart(updatedCart)
  }

  const handleRemove = (itemId: string) => {
    const updatedCart = removeFromCart(itemId)
    setCart(updatedCart)
  }

  const subtotal = getCartTotal(cart)

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
              <img src="/logo1.png" alt="Moto Kitchen" className="h-12 md:h-16 object-contain" />
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
              href="/order"
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
        <h1 className="text-4xl font-bold text-gray-900 mb-10">Your Cart</h1>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-4 border-b last:border-b-0"
            >
              <div className="flex items-center space-x-4 flex-1">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-gray-600">{formatCurrency(item.price)} each</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center border-2 border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    className="px-3 py-1.5 hover:bg-gray-100 transition font-semibold text-gray-700"
                  >
                    −
                  </button>
                  <span className="px-4 py-1.5 min-w-[3rem] text-center font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    className="px-3 py-1.5 hover:bg-gray-100 transition font-semibold text-gray-700"
                  >
                    +
                  </button>
                </div>

                <span className="text-lg font-semibold text-gray-900 w-24 text-right">
                  {formatCurrency(item.price * item.quantity)}
                </span>

                <button
                  onClick={() => handleRemove(item.id)}
                  className="text-red-600 hover:text-red-800 px-2"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="space-y-4">
            <div className="flex justify-between text-lg">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-gray-600">Delivery fee</span>
              <span className="text-gray-900">Calculated at checkout</span>
            </div>
            <div className="border-t pt-4 flex justify-between text-2xl font-bold">
              <span>Total</span>
              <span className="text-[#C9653B]">{formatCurrency(subtotal)}</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Link
              href="/order/checkout"
              className="block w-full text-center px-6 py-3 bg-[#C9653B] text-white rounded-lg hover:bg-[#B8552B] transition font-semibold"
            >
              Proceed to Checkout
            </Link>
            <Link
              href="/order"
              className="block w-full text-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

