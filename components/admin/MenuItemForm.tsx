'use client'

import { useState, useEffect } from 'react'
import { MenuItem, MenuCategory } from '@/types'

interface MenuItemFormProps {
  item?: MenuItem | null
  categories: MenuCategory[]
  onSubmit: (data: MenuItemFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export interface MenuItemFormData {
  name: string
  description: string
  price: number
  category_id: string | null
  image_url: string
  dietary_tags: string[]
  is_available: boolean
  is_published: boolean
  sort_order: number
}

const DIETARY_TAGS = ['vegetarian', 'vegan', 'gluten-free', 'halal', 'spicy', 'dairy-free']

export default function MenuItemForm({
  item,
  categories,
  onSubmit,
  onCancel,
  isLoading = false,
}: MenuItemFormProps) {
  const [formData, setFormData] = useState<MenuItemFormData>({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || 0,
    category_id: item?.category_id || null,
    image_url: item?.image_url || '',
    dietary_tags: item?.dietary_tags || [],
    is_available: item?.is_available !== false,
    is_published: item?.is_published !== false,
    sort_order: item?.sort_order || 0,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        price: item.price || 0,
        category_id: item.category_id || null,
        image_url: item.image_url || '',
        dietary_tags: item.dietary_tags || [],
        is_available: item.is_available !== false,
        is_published: item.is_published !== false,
        sort_order: item.sort_order || 0,
      })
    }
  }, [item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    await onSubmit(formData)
  }

  const toggleDietaryTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      dietary_tags: prev.dietary_tags.includes(tag)
        ? prev.dietary_tags.filter((t) => t !== tag)
        : [...prev.dietary_tags, tag],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-3 py-2 border rounded-md ${
            errors.name ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price (€) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.price ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.price && <p className="text-sm text-red-600 mt-1">{errors.price}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={formData.category_id || ''}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value || null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">No category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Image URL
        </label>
        <input
          type="url"
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dietary Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {DIETARY_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleDietaryTag(tag)}
              className={`px-3 py-1 text-sm rounded-md border transition ${
                formData.dietary_tags.includes(tag)
                  ? 'bg-[var(--brand-primary,#C9653B)] text-white border-[var(--brand-primary,#C9653B)]'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_available}
            onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Available</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_published}
            onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Published (visible on public menu)</span>
        </label>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 text-white rounded-md font-medium disabled:opacity-50"
          style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}
        >
          {isLoading ? 'Saving...' : item ? 'Update Item' : 'Create Item'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

