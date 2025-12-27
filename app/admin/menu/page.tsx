'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MenuItemCard from '@/components/admin/MenuItemCard'
import MenuItemForm, { MenuItemFormData } from '@/components/admin/MenuItemForm'
import { MenuItem, MenuCategory } from '@/types'

export default function AdminMenuPage() {
  const router = useRouter()
  const [items, setItems] = useState<(MenuItem & { menu_categories?: { name: string } })[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [publishedFilter, setPublishedFilter] = useState<string>('all') // all, published, draft
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

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
    setShowForm(true)
  }

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item)
    setShowForm(true)
  }

  const handleSubmitForm = async (formData: MenuItemFormData) => {
    try {
      const url = editingItem
        ? `/api/admin/menu/items/${editingItem.id}`
        : '/api/admin/menu/items'
      const method = editingItem ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowForm(false)
        setEditingItem(null)
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

  const handleBulkAction = async (action: 'enable' | 'disable' | 'publish' | 'unpublish') => {
    if (selectedItems.size === 0) {
      alert('Please select items first')
      return
    }

    if (!confirm(`Are you sure you want to ${action} ${selectedItems.size} item(s)?`)) {
      return
    }

    try {
      const updates = Array.from(selectedItems).map(async (itemId) => {
        const update: any = {}
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
      setSelectedItems(new Set())
      fetchMenuItems()
    } catch (error) {
      console.error('Error performing bulk action:', error)
      alert('Failed to perform bulk action')
    }
  }

  // Filter items
  const filteredItems = items.filter((item) => {
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
    return matchesSearch && matchesCategory && matchesPublished
  })

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
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--brand-secondary, #3A2A24)' }}>
            Menu Management
          </h1>
          <p style={{ color: 'var(--brand-muted, #4B4B4B)' }}>
            Manage your menu items and categories
          </p>
        </div>
        <button
          onClick={handleCreateItem}
          className="px-6 py-3 text-white rounded-md font-medium"
          style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}
        >
          Add Menu Item
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200 shadow-sm">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or description..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Published Status
            </label>
            <select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
            >
              <option value="all">All Items</option>
              <option value="published">Published Only</option>
              <option value="draft">Draft Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedItems.size} item(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('enable')}
                className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                Enable Selected
              </button>
              <button
                onClick={() => handleBulkAction('disable')}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Disable Selected
              </button>
              <button
                onClick={() => handleBulkAction('publish')}
                className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Publish Selected
              </button>
              <button
                onClick={() => handleBulkAction('unpublish')}
                className="px-3 py-1.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
              >
                Unpublish Selected
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800"
              >
                Clear Selection
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
              {editingItem ? 'Edit Menu Item' : 'Create Menu Item'}
            </h2>
            <MenuItemForm
              item={editingItem}
              categories={categories}
              onSubmit={handleSubmitForm}
              onCancel={() => {
                setShowForm(false)
                setEditingItem(null)
              }}
            />
          </div>
        </div>
      )}

      {/* Menu Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600 mb-4">
            {searchQuery || selectedCategory !== 'all'
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

