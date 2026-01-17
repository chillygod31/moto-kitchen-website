'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MenuCategory } from '@/types'

export default function AdminCategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [newName, setNewName] = useState('')

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
      fetchCategories()
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/admin/login')
    }
  }

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/menu/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) {
      setError('Category name is required')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const response = await fetch('/api/admin/menu/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          sort_order: categories.length,
        }),
      })

      if (response.ok) {
        setNewName('')
        fetchCategories()
      } else {
        const err = await response.json()
        setError(err.message || 'Failed to create category')
      }
    } catch (error) {
      console.error('Error creating category:', error)
      setError('Failed to create category')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) {
      setError('Category name is required')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const response = await fetch(`/api/admin/menu/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
        }),
      })

      if (response.ok) {
        setEditingId(null)
        setEditName('')
        fetchCategories()
      } else {
        const err = await response.json()
        setError(err.message || 'Failed to update category')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      setError('Failed to update category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? Items in this category will become uncategorized.`)) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      const response = await fetch(`/api/admin/menu/categories/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchCategories()
      } else {
        const err = await response.json()
        setError(err.message || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      setError('Failed to delete category')
    } finally {
      setSaving(false)
    }
  }

  const startEditing = (cat: MenuCategory) => {
    setEditingId(cat.id)
    setEditName(cat.name)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditName('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p style={{ color: 'var(--brand-muted, #4B4B4B)' }}>Loading categories...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 600, color: 'var(--brand-secondary, #3A2A24)' }}>
            Category Management
          </h1>
          <p style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, color: 'var(--brand-muted, #4B4B4B)' }}>
            Organize your menu items into categories
          </p>
        </div>
        <Link
          href="/admin/menu"
          className="px-4 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
        >
          Back to Menu
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {/* Add New Category */}
      <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--brand-secondary, #3A2A24)' }}>
          Add New Category
        </h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
          />
          <button
            onClick={handleCreate}
            disabled={saving || !newName.trim()}
            className="px-6 py-2 text-white rounded-md font-medium disabled:opacity-50"
            style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}
          >
            {saving ? 'Adding...' : 'Add Category'}
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600">No categories yet. Create your first category above.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {editingId === cat.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#C9653B)]"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{cat.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      {editingId === cat.id ? (
                        <>
                          <button
                            onClick={() => handleUpdate(cat.id)}
                            disabled={saving}
                            className="px-3 py-1 text-sm font-medium text-white rounded"
                            style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(cat)}
                            className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className="px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
