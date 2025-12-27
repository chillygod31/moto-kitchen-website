'use client'

import { useEffect, useRef } from 'react'

const COOLDOWN_MS = 2000

export default function MarketingClickTracker() {
  const lastFiredRef = useRef<Record<string, number>>({})

  useEffect(() => {
    const onClickCapture = (e: MouseEvent) => {
      const target = e.target as Element | null
      const anchor = target?.closest('a') as HTMLAnchorElement | null
      if (!anchor) return

      const href = anchor.getAttribute('href') || ''

      let contactMethod: 'phone' | 'email' | 'whatsapp' | null = null

      if (href.startsWith('tel:')) {
        contactMethod = 'phone'
      } else if (href.startsWith('mailto:')) {
        contactMethod = 'email'
      } else if (
        href.includes('wa.me') ||
        href.includes('api.whatsapp.com') ||
        href.includes('whatsapp.com')
      ) {
        contactMethod = 'whatsapp'
      }

      if (!contactMethod) return

      const now = Date.now()
      const key = `contact_click:${contactMethod}:${window.location.pathname}`
      const last = lastFiredRef.current[key] || 0
      if (now - last < COOLDOWN_MS) return
      lastFiredRef.current[key] = now

      // No PII: do NOT send phone number or email address.
      ;(window as any).dataLayer = (window as any).dataLayer || []
      ;(window as any).dataLayer.push({
        event: 'contact_click',
        contact_method: contactMethod,
        page_path: window.location.pathname,
      })
    }

    document.addEventListener('click', onClickCapture, true)
    return () => {
      document.removeEventListener('click', onClickCapture, true)
    }
  }, [])

  return null
}


