'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import MenuItemCard from '@/components/admin/MenuItemCard'
import MenuItemForm, { MenuItemFormData } from '@/components/admin/MenuItemForm'
import { MenuItem, MenuCategory } from '@/types'

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'newest' | 'oldest'
type ViewMode = 'grid' | 'list'

export default function AdminMenuPage() {
  const router = useRouter()
  const [items, setItems] = useState<(MenuItem & { menu_categories?: { name: string } })[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [duplicatingItem, setDuplicatingItem] = useState<MenuItem | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [publishedFilter, setPublishedFilter] = useState<string>('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all')
  const [sortOption, setSortOption] = useState<SortOption>('name-asc')

  // View & Selection
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  // Bulk move category modal
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [moveToCategory, setMoveToCategory] = useState<string>('')

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  const checkAuthAndFetch = async () => {
    try {
      const response = await fetch('/api/admin/session')
      if (!response.ok) {
        router.push('/admin/login')
        return
      }
      fetchMenuItems()
      fetchCategories()
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/admin/login')
    }
  }

  const fetchMenuItems = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/menu/items')
      if (response.ok) {
        const data = await response.json()
        setItems(data || [])
      }
    } catch (error) {
      console.error('Error fetching menu items:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/menu/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleCreateItem = () => {
    setEditingItem(null)
    setDuplicatingItem(null)
    setShowForm(true)
  }

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item)
    setDuplicatingItem(null)
    setShowForm(true)
  }

  const handleDuplicateItem = (item: MenuItem) => {
    setEditingItem(null)
    setDuplicatingItem(item)
    setShowForm(true)
  }

  const handleSubmitForm = async (formData: MenuItemFormData) => {
    try {
      const url = editingItem
        ? `/api/admin/menu/items/${editingItem.id}`
        : '/api/admin/menu/items'
      const method = editingItem ? 'PATCH' : 'POST'

      // If duplicating, modify the name
      const submitData = duplicatingItem
        ? { ...formData, name: formData.name || `${duplicatingItem.name} (Copy)` }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        setShowForm(false)
        setEditingItem(null)
        setDuplicatingItem(null)
        fetchMenuItems()
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to save menu item')
      }
    } catch (error) {
      console.error('Error saving menu item:', error)
      alert('Failed to save menu item')
    }
  }

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const response = await fetch(`/api/admin/menu/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: !item.is_available }),
      })

      if (response.ok) {
        fetchMenuItems()
      } else {
        alert('Failed to update availability')
      }
    } catch (error) {
      console.error('Error updating availability:', error)
      alert('Failed to update availability')
    }
  }

  const handleTogglePublished = async (item: MenuItem) => {
    try {
      const response = await fetch(`/api/admin/menu/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !item.is_published }),
      })

      if (response.ok) {
        fetchMenuItems()
      } else {
        alert('Failed to update published status')
      }
    } catch (error) {
      console.error('Error updating published status:', error)
      alert('Failed to update published status')
    }
  }

  const handleDeleteItem = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/menu/items/${item.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchMenuItems()
      } else {
        alert('Failed to delete menu item')
      }
    } catch (error) {
      console.error('Error deleting menu item:', error)
      alert('Failed to delete menu item')
    }
  }

  const handleBulkAction = async (action: 'enable' | 'disable' | 'publish' | 'unpublish' | 'delete') => {
    if (selectedItems.size === 0) {
      alert('Please select items first')
      return
    }

    const actionText = action === 'delete' ? 'permanently delete' : action
    if (!confirm(`Are you sure you want to ${actionText} ${selectedItems.size} item(s)?`)) {
      return
    }

    try {
      if (action === 'delete') {
        const deletes = Array.from(selectedItems).map((itemId) =>
          fetch(`/api/admin/menu/items/${itemId}`, { method: 'DELETE' })
        )
        await Promise.all(deletes)
      } else {
        const updates = Array.from(selectedItems).map(async (itemId) => {
          const update: Record<string, boolean> = {}
          if (action === 'enable') update.is_available = true
          if (action === 'disable') update.is_available = false
          if (action === 'publish') update.is_published = true
          if (action === 'unpublish') update.is_published = false

          return fetch(`/api/admin/menu/items/${itemId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(update),
          })
        })
        await Promise.all(updates)
      }
      setSelectedItems(new Set())
      fetchMenuItems()
    } catch (error) {
      console.error('Error performing bulk action:', error)
      alert('Failed to perform bulk action')
    }
  }

  const handleBulkMoveCategory = async () => {
    if (selectedItems.size === 0 || !moveToCategory) {
      return
    }

    try {
      const updates = Array.from(selectedItems).map((itemId) =>
        fetch(`/api/admin/menu/items/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category_id: moveToCategory }),
        })
      )
      await Promise.all(updates)
      setSelectedItems(new Set())
      setShowMoveModal(false)
      setMoveToCategory('')
      fetchMenuItems()
    } catch (error) {
      console.error('Error moving items:', error)
      alert('Failed to move items')
    }
  }

  // Select all / deselect all
  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredItems.map((item) => item.id)))
    }
  }

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      const matchesSearch = searchQuery
        ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        : true
      const matchesCategory =
        selectedCategory === 'all' || item.category_id === selectedCategory
      const matchesPublished =
        publishedFilter === 'all' ||
        (publishedFilter === 'published' && item.is_published) ||
        (publishedFilter === 'draft' && !item.is_published)
      const matchesAvailability =
        availabilityFilter === 'all' ||
        (availabilityFilter === 'available' && item.is_available) ||
        (availabilityFilter === 'unavailable' && !item.is_available)
      return matchesSearch && matchesCategory && matchesPublished && matchesAvailability
    })

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        case 'oldest':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        default:
          return 0
      }
    })

    return result
  }, [items, searchQuery, selectedCategory, publishedFilter, availabilityFilter, sortOption])

  const allSelected = filteredItems.length > 0 && selectedItems.size === filteredItems.length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p style={{ color: 'var(--brand-muted, #4B4B4B)' }}>Loading menu items...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 600, color: 'var(--brand-secondary, #3A2A24)' }}>
            Menu Management
          </h1>
          <p style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, color: 'var(--brand-muted, #4B4B4B)' }}>
            Manage your menu items and categories
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/categories"
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
          >
            Manage Categories
          </Link>
          <button
            onClick={handleCreateItem}
            className="px-6 py-3 text-white rounded-md font-medium"
            style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}
          >
            Add Menu Item
          </button>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="bg-white rounded-lg p-4 md:p-6 mb-6 border border-gray-200 shadow-sm">
        {/* Top row: Search, View Toggle, Sort */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or description..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
            />
          </div>
          <div className="flex gap-2">
            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                title="Grid view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                title="List view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
            {/* Sort Dropdown */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="price-asc">Price Low-High</option>
              <option value="price-desc">Price High-Low</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Filter row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={publishedFilter}
            onChange={(e) => setPublishedFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
          >
            <option value="all">All Availability</option>
            <option value="available">Available (On)</option>
            <option value="unavailable">Unavailable (Off)</option>
          </select>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('all')
              setPublishedFilter('all')
              setAvailabilityFilter('all')
              setSortOption('name-asc')
            }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Selection Bar */}
      <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-gray-300 text-[var(--brand-primary,#C9653B)] focus:ring-[var(--brand-primary,#C9653B)]"
            />
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-sm text-gray-600">
            {selectedItems.size > 0 ? (
              <span className="font-medium text-blue-600">{selectedItems.size} of {filteredItems.length} selected</span>
            ) : (
              <span>{filteredItems.length} items</span>
            )}
          </span>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleBulkAction('enable')}
              className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Enable
            </button>
            <button
              onClick={() => handleBulkAction('disable')}
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Disable
            </button>
            <button
              onClick={() => handleBulkAction('publish')}
              className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Publish
            </button>
            <button
              onClick={() => handleBulkAction('unpublish')}
              className="px-3 py-1.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
            >
              Unpublish
            </button>
            <button
              onClick={() => setShowMoveModal(true)}
              className="px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
            >
              Move to Category
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Delete
            </button>
            <button
              onClick={() => setSelectedItems(new Set())}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Move Category Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Move {selectedItems.size} item(s) to category</h3>
            <select
              value={moveToCategory}
              onChange={(e) => setMoveToCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
            >
              <option value="">Select a category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowMoveModal(false)
                  setMoveToCategory('')
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkMoveCategory}
                disabled={!moveToCategory}
                className="px-4 py-2 text-sm text-white rounded-md disabled:opacity-50"
                style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}
              >
                Move Items
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editingItem ? 'Edit Menu Item' : duplicatingItem ? 'Duplicate Menu Item' : 'Create Menu Item'}
            </h2>
            <MenuItemForm
              item={editingItem || duplicatingItem}
              categories={categories}
              onSubmit={handleSubmitForm}
              onCancel={() => {
                setShowForm(false)
                setEditingItem(null)
                setDuplicatingItem(null)
              }}
              isDuplicate={!!duplicatingItem}
            />
          </div>
        </div>
      )}

      {/* Menu Items */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600 mb-4">
            {searchQuery || selectedCategory !== 'all' || publishedFilter !== 'all' || availabilityFilter !== 'all'
              ? 'No menu items match your filters'
              : 'No menu items yet'}
          </p>
          <button
            onClick={handleCreateItem}
            className="px-6 py-3 text-white rounded-md font-medium"
            style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}
          >
            Add Your First Menu Item
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="relative">
              <input
                type="checkbox"
                checked={selectedItems.has(item.id)}
                onChange={(e) => {
                  const newSelected = new Set(selectedItems)
                  if (e.target.checked) {
                    newSelected.add(item.id)
                  } else {
                    newSelected.delete(item.id)
                  }
                  setSelectedItems(newSelected)
                }}
                className="absolute top-2 left-2 z-10 w-5 h-5 rounded border-gray-300 text-[var(--brand-primary,#C9653B)] focus:ring-[var(--brand-primary,#C9653B)]"
                onClick={(e) => e.stopPropagation()}
              />
              <MenuItemCard
                item={item}
                onEdit={handleEditItem}
                onToggleAvailability={handleToggleAvailability}
                onTogglePublished={handleTogglePublished}
                onDelete={handleDeleteItem}
                onDuplicate={handleDuplicateItem}
              />
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-[var(--brand-primary,#C9653B)] focus:ring-[var(--brand-primary,#C9653B)]"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Price</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 ${!item.is_available ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedItems)
                        if (e.target.checked) {
                          newSelected.add(item.id)
                        } else {
                          newSelected.delete(item.id)
                        }
                        setSelectedItems(newSelected)
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-[var(--brand-primary,#C9653B)] focus:ring-[var(--brand-primary,#C9653B)]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-lg">🍽️</div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 truncate max-w-xs hidden lg:block">{item.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-gray-600">{(item.menu_categories as any)?.name || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-sm" style={{ color: 'var(--brand-primary, #C9653B)' }}>
                      €{item.price.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex justify-center gap-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        item.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.is_available ? 'On' : 'Off'}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        item.is_published ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.is_published ? 'Live' : 'Draft'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="px-2 py-1 text-xs font-medium text-white rounded"
                        style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDuplicateItem(item)}
                        className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                        title="Duplicate"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          item.is_available ? 'text-gray-600 hover:bg-gray-100' : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {item.is_available ? 'Off' : 'On'}
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded"
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
