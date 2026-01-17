'use client'

import Image from 'next/image'
import { MenuItem } from '@/types'

interface MenuItemCardProps {
  item: MenuItem & { menu_categories?: { name: string } }
  onEdit: (item: MenuItem) => void
  onToggleAvailability: (item: MenuItem) => void
  onTogglePublished: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
  onDuplicate?: (item: MenuItem) => void
}

export default function MenuItemCard({
  item,
  onEdit,
  onToggleAvailability,
  onTogglePublished,
  onDelete,
  onDuplicate,
}: MenuItemCardProps) {
  return (
    <div className={`bg-white rounded-lg border overflow-hidden transition flex md:flex-col ${
      item.is_available ? 'border-gray-200 hover:border-gray-300 hover:shadow-md' : 'border-gray-100 opacity-60'
    }`}>
      {/* Image - horizontal on mobile, vertical on desktop */}
      {item.image_url ? (
        <div className="relative w-24 h-24 md:w-full md:h-40 bg-gray-100 flex-shrink-0">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 96px, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="w-24 h-24 md:w-full md:h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
          <span className="text-3xl md:text-5xl">🍽️</span>
        </div>
      )}

      <div className="flex-1 p-3 md:p-4 flex flex-col min-w-0">
        {/* Header row with name and status badges */}
        <div className="flex items-start justify-between gap-2 mb-1 md:mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm md:text-base font-semibold text-gray-900 truncate">{item.name}</h3>
            {(item.menu_categories as any)?.name && (
              <p className="text-xs text-gray-500 truncate">
                {(item.menu_categories as any).name}
              </p>
            )}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <span className={`px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-xs font-medium rounded ${
              item.is_available
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {item.is_available ? 'On' : 'Off'}
            </span>
            <span
              className={`px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-xs font-medium rounded cursor-pointer ${
                item.is_published
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                onTogglePublished(item)
              }}
              title={item.is_published ? 'Click to unpublish' : 'Click to publish'}
            >
              {item.is_published ? 'Live' : 'Draft'}
            </span>
          </div>
        </div>

        {/* Description - hidden on mobile, shown on desktop */}
        {item.description && (
          <p className="hidden md:block text-xs text-gray-600 mb-2 line-clamp-2">{item.description}</p>
        )}

        {/* Price and dietary tags */}
        <div className="flex items-center justify-between gap-2 mb-2 md:mb-3">
          <span className="text-base md:text-lg font-bold" style={{ color: 'var(--brand-primary, #C9653B)' }}>
            €{item.price.toFixed(2)}
          </span>
          {item.dietary_tags && item.dietary_tags.length > 0 && (
            <div className="hidden md:flex gap-1 flex-wrap">
              {item.dietary_tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded"
                >
                  {tag}
                </span>
              ))}
              {item.dietary_tags.length > 2 && (
                <span className="px-1 py-0.5 text-[10px] text-gray-500">
                  +{item.dietary_tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 md:gap-2 mt-auto pt-2 md:pt-3 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(item)
            }}
            className="flex-1 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium text-white rounded"
            style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}
          >
            Edit
          </button>
          {onDuplicate && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDuplicate(item)
              }}
              className="px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 rounded"
              title="Duplicate item"
            >
              <span className="hidden md:inline">Copy</span>
              <span className="md:hidden">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </span>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleAvailability(item)
            }}
            className={`flex-1 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded ${
              item.is_available
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            {item.is_available ? 'Disable' : 'Enable'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(item)
            }}
            className="px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium text-red-600 hover:bg-red-50 rounded"
          >
            <span className="hidden md:inline">Delete</span>
            <span className="md:hidden">×</span>
          </button>
        </div>
      </div>
    </div>
  )
}
