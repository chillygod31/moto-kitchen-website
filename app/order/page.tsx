'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MenuItem, MenuCategory } from '@/types'
import { addToCart, getCart, getCartItemCount } from '@/lib/cart'
import { formatCurrency } from '@/lib/utils'

interface MenuData {
  categories: (MenuCategory & { items: MenuItem[] })[]
  allItems: MenuItem[]
}

export default function MenuPage() {
  const [menuData, setMenuData] = useState<MenuData | null>(null)
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showAddedNotification, setShowAddedNotification] = useState<string | null>(null)

  useEffect(() => {
    fetchMenu()
    updateCartCount()
    
    // Listen for cart changes
    const interval = setInterval(updateCartCount, 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchMenu = async () => {
    try {
      const response = await fetch('/api/menu')
      if (!response.ok) throw new Error('Failed to fetch menu')
      const data = await response.json()
      setMenuData(data)
      if (data.categories.length > 0) {
        setActiveCategory(data.categories[0].id)
      }
    } catch (error) {
      console.error('Error fetching menu:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateCartCount = () => {
    const cart = getCart()
    setCartCount(getCartItemCount(cart))
  }

  const handleAddToCart = (item: MenuItem) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
    })
    updateCartCount()
    setShowAddedNotification(item.name)
    setTimeout(() => setShowAddedNotification(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6EF]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9653B] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  if (!menuData || menuData.categories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6EF]">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">No menu items available</p>
          <Link href="/order" className="text-[#C9653B] hover:underline">Back to Menu</Link>
        </div>
      </div>
    )
  }

  const activeCategoryData = menuData.categories.find((cat) => cat.id === activeCategory)

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Header */}
      <header className="bg-[#3A2A24] sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/order" className="flex items-center gap-3 hover:opacity-80 transition">
              <img src="/logo1.png" alt="Moto Kitchen" className="h-12 md:h-16 object-contain" />
              <div className="flex flex-col -ml-2">
                <span className="text-white text-lg md:text-xl leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>Moto Kitchen</span>
                <span className="text-white/80 text-[8px] md:text-[10px] uppercase tracking-[0.15em] leading-tight" style={{ fontFamily: 'var(--font-cinzel)' }}>East African Catering Service</span>
              </div>
            </Link>
            <Link
              href="/order/cart"
              className="relative px-6 py-2.5 bg-[#C9653B] text-white rounded-lg hover:bg-[#B8552B] transition font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[#3A2A24] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Menu</h1>
          <p className="text-xl text-white/80">Authentic Tanzanian dishes crafted with traditional recipes</p>
        </div>
      </section>

      {/* Category Tabs */}
      <div className="bg-white border-b sticky top-[73px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {menuData.categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-6 py-4 whitespace-nowrap font-medium transition border-b-2 ${
                  activeCategory === category.id
                    ? 'text-[#C9653B] border-[#C9653B]'
                    : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300'
                }`}
              >
                {category.name}
                {category.items.length > 0 && (
                  <span className="ml-2 text-sm opacity-75">
                    ({category.items.length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {showAddedNotification && (
        <div className="fixed top-24 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in">
          ✓ {showAddedNotification} added to cart!
        </div>
      )}

      {/* Menu Items */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeCategoryData && activeCategoryData.items.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeCategoryData.items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {item.image_url ? (
                  <div className="relative h-56 overflow-hidden bg-gray-200">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-56 bg-gradient-to-br from-[#F1E7DA] to-[#E6D9C8] flex items-center justify-center">
                    <span className="text-6xl">🍽️</span>
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  {item.dietary_tags && item.dietary_tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.dietary_tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-2xl font-bold text-[#C9653B]">
                      {formatCurrency(item.price)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="px-5 py-2.5 bg-[#C9653B] text-white rounded-lg hover:bg-[#B8552B] transition font-semibold text-sm"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">No items in this category</p>
          </div>
        )}
      </main>
    </div>
  )
}

