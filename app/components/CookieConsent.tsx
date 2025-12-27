'use client'

import { useState, useEffect } from 'react'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const setConsent = (value: 'all' | 'essential' | 'none') => {
    localStorage.setItem('cookie-consent', value)
    // Also set cookie for server-side access
    document.cookie = `cookie-consent=${value}; path=/; max-age=31536000; SameSite=Lax`

    // Update Google Consent Mode (GTM listens via dataLayer/gtag)
    // - For marketing Phase 0: we only toggle analytics_storage
    try {
      if (typeof window !== 'undefined') {
        const w = window as any
        w.dataLayer = w.dataLayer || []
        if (!w.gtag) {
          // In case the consent-default script hasn't run yet, define gtag() to push into dataLayer
          w.gtag = (...args: any[]) => {
            w.dataLayer.push(args)
          }
        }

        const analyticsGranted = value === 'all'
        w.gtag('consent', 'update', {
          analytics_storage: analyticsGranted ? 'granted' : 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
        })

        // Optional debug event for GTM Preview
        w.dataLayer.push({
          event: 'cookie_consent_update',
          cookie_consent: value,
        })
      }
    } catch {
      // Never block the UX on analytics
    }

    setShowBanner(false)
    setShowCustomize(false)
  }

  if (!showBanner) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-2xl z-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {!showCustomize ? (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Cookie Consent
              </h3>
              <p className="text-sm text-gray-600">
                We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
                By clicking "Accept All", you consent to our use of cookies. You can also choose to customize your preferences.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                <a href="/privacy" className="text-[#C9653B] hover:underline">
                  Privacy Policy
                </a>
                {' • '}
                <a href="/cookie-policy" className="text-[#C9653B] hover:underline">
                  Cookie Policy
                </a>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <button
                onClick={() => setConsent('all')}
                className="px-6 py-2 bg-[#C9653B] text-white rounded-md hover:bg-[#B8552B] transition font-medium text-sm"
              >
                Accept All
              </button>
              <button
                onClick={() => setShowCustomize(true)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition font-medium text-sm"
              >
                Customize
              </button>
              <button
                onClick={() => setConsent('essential')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition font-medium text-sm"
              >
                Reject All
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Customize Cookie Preferences
            </h3>
            <div className="space-y-3 mb-4">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium text-gray-900">Essential Cookies</div>
                  <div className="text-sm text-gray-600">Required for the site to function</div>
                </div>
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="rounded border-gray-300 text-[#C9653B] focus:ring-[#C9653B]"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium text-gray-900">Analytics Cookies</div>
                  <div className="text-sm text-gray-600">Help us understand how visitors interact with our site</div>
                </div>
                <input
                  type="checkbox"
                  id="analytics"
                  defaultChecked={true}
                  className="rounded border-gray-300 text-[#C9653B] focus:ring-[#C9653B]"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const analytics = (document.getElementById('analytics') as HTMLInputElement)?.checked
                  setConsent(analytics ? 'all' : 'essential')
                }}
                className="px-6 py-2 bg-[#C9653B] text-white rounded-md hover:bg-[#B8552B] transition font-medium text-sm"
              >
                Save Preferences
              </button>
              <button
                onClick={() => setShowCustomize(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

