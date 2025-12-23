'use client'

import Image from 'next/image'
import { MenuItem } from '@/types'

interface MenuItemCardProps {
  item: MenuItem & { menu_categories?: { name: string } }
  onEdit: (item: MenuItem) => void
  onToggleAvailability: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
}

export default function MenuItemCard({
  item,
  onEdit,
  onToggleAvailability,
  onDelete,
}: MenuItemCardProps) {
  return (
    <div className={`bg-white rounded-lg border-2 overflow-hidden transition ${
      item.is_available ? 'border-gray-200 hover:border-gray-300' : 'border-gray-100 opacity-60'
    }`}>
      {item.image_url && (
        <div className="relative h-48 w-full bg-gray-100">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
            {(item.menu_categories as any)?.name && (
              <p className="text-sm text-gray-500 mt-1">
                {(item.menu_categories as any).name}
              </p>
            )}
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            item.is_available
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {item.is_available ? 'Available' : 'Unavailable'}
          </span>
        </div>
        
        {item.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-xl font-bold" style={{ color: 'var(--brand-primary, #C9653B)' }}>
            €{item.price.toFixed(2)}
          </span>
          {item.dietary_tags && item.dietary_tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {item.dietary_tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                >
                  {tag}
                </span>
              ))}
              {item.dietary_tags.length > 2 && (
                <span className="px-2 py-1 text-xs text-gray-500">
                  +{item.dietary_tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex gap-2 pt-3 border-t border-gray-200">
          <button
            onClick={() => onEdit(item)}
            className="flex-1 px-3 py-2 text-sm font-medium text-white rounded"
            style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}
          >
            Edit
          </button>
          <button
            onClick={() => onToggleAvailability(item)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded ${
              item.is_available
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            {item.is_available ? 'Disable' : 'Enable'}
          </button>
          <button
            onClick={() => onDelete(item)}
            className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

