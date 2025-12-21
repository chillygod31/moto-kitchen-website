'use client'

import { formatCurrency } from '@/lib/utils'

interface BusinessSettings {
  min_order_value: number
  timezone?: string
  service_types?: string[]
  business_hours?: any
  lead_time_minutes?: number
}

interface ServiceInfoBannerProps {
  settings: BusinessSettings | null
}

export default function ServiceInfoBanner({ settings }: ServiceInfoBannerProps) {
  if (!settings) return null

  const serviceTypes = settings.service_types || ['pickup', 'delivery']
  const minOrder = settings.min_order_value || 0
  const businessHours = settings.business_hours

  return (
    <div className="bg-gradient-to-r from-[#C9653B] to-[#B8552B] text-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm md:text-base">
          {/* Service Types */}
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>
              {serviceTypes.includes('delivery') && serviceTypes.includes('pickup')
                ? 'Delivery & Pickup Available'
                : serviceTypes.includes('delivery')
                ? 'Delivery Available'
                : 'Pickup Available'}
            </span>
          </div>

          {/* Business Hours */}
          {businessHours && (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {typeof businessHours === 'string' ? businessHours : 'Open for orders'}
              </span>
            </div>
          )}

          {/* Minimum Order */}
          {minOrder > 0 && (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Minimum Order: {formatCurrency(minOrder)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

