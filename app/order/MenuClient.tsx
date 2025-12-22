'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MenuItem, MenuCategory } from '@/types'
import { addToCart, getCart, getCartItemCount } from '@/lib/cart'
import { formatCurrency } from '@/lib/utils'
import { trackViewMenu, trackAddToCart } from '@/lib/analytics'
import ErrorMessage from './components/ErrorMessage'
import ServiceInfoBanner from './components/ServiceInfoBanner'

interface MenuData {
  categories: (MenuCategory & { items: MenuItem[] })[]
  allItems: MenuItem[]
}

interface BusinessSettings {
  min_order_value: number
  timezone?: string
  service_types?: string[]
  business_hours?: any
  lead_time_minutes?: number
}

interface MenuClientProps {
  initialMenuData: MenuData
  error?: string | null
  businessSettings?: BusinessSettings | null
}

export default function MenuClient({ initialMenuData, error: initialError, businessSettings }: MenuClientProps) {
  const [menuData] = useState<MenuData>(initialMenuData)
  const [cartCount, setCartCount] = useState(0)
  const [activeCategory, setActiveCategory] = useState<string | null>(
    initialMenuData.categories.length > 0 ? initialMenuData.categories[0].id : null
  )
  const [showAddedNotification, setShowAddedNotification] = useState<string | null>(null)
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({})
  const [cartIconPulse, setCartIconPulse] = useState(false)
  const [showCartTooltip, setShowCartTooltip] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedDietaryFilters, setSelectedDietaryFilters] = useState<Set<string>>(new Set())
  const [orderStats, setOrderStats] = useState<{ ordersToday: number; popularItems: { itemId: string; name?: string; count: number }[] } | null>(null)

  useEffect(() => {
    updateCartCount()
    
    // Track menu view
    trackViewMenu()
    
    // Listen for cart changes
    const interval = setInterval(updateCartCount, 1000)
    return () => clearInterval(interval)
  }, [])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch order stats for social proof
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/orders/stats')
        if (res.ok) {
          const stats = await res.json()
          setOrderStats(stats)
        }
      } catch (error) {
        console.error('Error fetching order stats:', error)
      }
    }
    fetchStats()
    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const updateCartCount = () => {
    const cart = getCart()
    setCartCount(getCartItemCount(cart))
  }

  const handleQuantityChange = (itemId: string, delta: number) => {
    setItemQuantities((prev) => {
      const current = prev[itemId] || 1
      const newQuantity = Math.max(1, current + delta)
      return { ...prev, [itemId]: newQuantity }
    })
  }

  const handleAddToCart = (item: MenuItem) => {
    const quantity = itemQuantities[item.id] || 1
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
    }, quantity)
    updateCartCount()
    
    // Track add to cart event
    trackAddToCart(item.id, item.name, item.price, quantity)
    
    // Reset quantity after adding
    setItemQuantities((prev) => {
      const updated = { ...prev }
      delete updated[item.id]
      return updated
    })
    
    // Trigger cart icon animation
    setCartIconPulse(true)
    setTimeout(() => setCartIconPulse(false), 600)
    
    setShowAddedNotification(item.name)
    setTimeout(() => setShowAddedNotification(null), 2000)
  }

  const getCartTotal = () => {
    const cart = getCart()
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  // Get unique dietary tags from all menu items
  const getAllDietaryTags = () => {
    const tags = new Set<string>()
    menuData.allItems.forEach((item) => {
      if (item.dietary_tags && Array.isArray(item.dietary_tags)) {
        item.dietary_tags.forEach((tag) => tags.add(tag))
      }
    })
    return Array.from(tags).sort()
  }

  // Filter menu items based on search query and dietary filters
  const getFilteredItems = () => {
    let items = menuData.allItems

    // Filter by category
    if (activeCategory) {
      items = items.filter((item) => item.category_id === activeCategory)
    }

    // Filter by search query
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      items = items.filter((item) => {
        const matchesName = item.name.toLowerCase().includes(query)
        const matchesDescription = item.description?.toLowerCase().includes(query) || false
        return matchesName || matchesDescription
      })
    }

    // Filter by dietary tags
    if (selectedDietaryFilters.size > 0) {
      items = items.filter((item) => {
        if (!item.dietary_tags || !Array.isArray(item.dietary_tags)) return false
        const itemTags = new Set(item.dietary_tags.map((t) => t.toLowerCase()))
        return Array.from(selectedDietaryFilters).some((filter) =>
          itemTags.has(filter.toLowerCase())
        )
      })
    }

    return items
  }

  const toggleDietaryFilter = (tag: string) => {
    setSelectedDietaryFilters((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(tag)) {
        newSet.delete(tag)
      } else {
        newSet.add(tag)
      }
      return newSet
    })
  }

  const filteredItems = getFilteredItems()

  if (!menuData || menuData.categories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6EF]">
        <div className="text-center max-w-md mx-auto px-4">
          {initialError ? (
            <>
              <ErrorMessage
                message={`Error Loading Menu: ${initialError}`}
                className="mb-4"
              />
              <p className="text-xs text-gray-500 mb-4">
                This is likely a configuration issue. Please check:
                <br />1. Environment variables are set in Vercel
                <br />2. Database schema is set up in Supabase
                <br />3. Tenant exists in the database
              </p>
            </>
          ) : (
            <p className="text-xl text-gray-600 mb-4">No menu items available</p>
          )}
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
              <Image src="/logo1.png" alt="Moto Kitchen" width={64} height={64} className="h-12 md:h-16 w-auto object-contain" />
              <div className="flex flex-col -ml-2">
                <span className="text-white text-lg md:text-xl leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>Moto Kitchen</span>
                <span className="text-white/80 text-[8px] md:text-[10px] uppercase tracking-[0.15em] leading-tight" style={{ fontFamily: 'var(--font-cinzel)' }}>East African Catering Service</span>
              </div>
            </Link>
            <Link
              href="/order/cart"
              className={`relative px-6 py-2.5 bg-[#C9653B] text-white rounded-lg hover:bg-[#B8552B] transition-all font-semibold flex items-center gap-2 ${
                cartIconPulse ? 'animate-pulse scale-110' : ''
              }`}
              onMouseEnter={() => cartCount > 0 && setShowCartTooltip(true)}
              onMouseLeave={() => setShowCartTooltip(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center transition-all duration-300 animate-bounce">
                  {cartCount}
                </span>
              )}
              {showCartTooltip && cartCount > 0 && (
                <div className="absolute top-full right-0 mt-2 bg-gray-900 text-white text-sm rounded-lg px-3 py-2 whitespace-nowrap z-50 shadow-lg">
                  {formatCurrency(getCartTotal())} • {cartCount} {cartCount === 1 ? 'item' : 'items'}
                  <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
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

      {/* Service Info Banner */}
      <ServiceInfoBanner settings={businessSettings || null} />

      {/* Urgency Indicators & Social Proof */}
      {(orderStats?.ordersToday !== undefined) && (
        <div className="bg-white border-b px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-4 text-sm text-gray-700">
            {orderStats.ordersToday > 5 && (
              <div className="flex items-center gap-2">
                <span className="text-red-500">🔥</span>
                <span>{orderStats.ordersToday} orders today</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span>🔔</span>
              <span>Order by 8 PM for tomorrow delivery</span>
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="bg-white border-b sticky top-[73px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide px-2 sm:px-4 lg:px-8" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {menuData.categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap font-medium transition border-b-2 flex-shrink-0 text-sm sm:text-base ${
                  activeCategory === category.id
                    ? 'text-[#C9653B] border-[#C9653B]'
                    : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300'
                }`}
              >
                {category.name}
                {category.items.length > 0 && (
                  <span className="ml-2 text-xs sm:text-sm opacity-75">
                    ({category.items.length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent text-base"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {debouncedSearchQuery && (
            <p className="mt-2 text-sm text-gray-600">
              {filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'} found
            </p>
          )}
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
        {filteredItems.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {item.image_url ? (
                  <div className="relative h-56 overflow-hidden bg-gray-200">
                    <Image
                      src={item.image_url}
                      alt={item.name || 'Menu item'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      loading="lazy"
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
                  <div className="pt-4 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-[#C9653B]">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border-2 border-gray-300 rounded-lg">
                        <button
                          onClick={() => handleQuantityChange(item.id, -1)}
                          className="px-3 py-2 hover:bg-gray-100 transition font-semibold text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="px-4 py-2 min-w-[3rem] text-center font-medium min-h-[44px] flex items-center justify-center">
                          {itemQuantities[item.id] || 1}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="px-3 py-2 hover:bg-gray-100 transition font-semibold text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="flex-1 px-5 py-2.5 bg-[#C9653B] text-white rounded-lg hover:bg-[#B8552B] transition font-semibold text-sm min-h-[44px] flex items-center justify-center touch-manipulation"
                      aria-label={`Add ${item.name} to cart`}
                    >
                      Add to Cart
                    </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">
              {debouncedSearchQuery
                ? `No items found for "${debouncedSearchQuery}"`
                : 'No items in this category'}
            </p>
            {debouncedSearchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-[#C9653B] hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

