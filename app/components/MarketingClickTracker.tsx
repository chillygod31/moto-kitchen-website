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

      let eventName: 'phone_click' | 'whatsapp_click' | 'email_click' | null =
        null

      if (href.startsWith('tel:')) {
        eventName = 'phone_click'
      } else if (href.startsWith('mailto:')) {
        eventName = 'email_click'
      } else if (
        href.includes('wa.me') ||
        href.includes('api.whatsapp.com') ||
        href.includes('whatsapp.com')
      ) {
        eventName = 'whatsapp_click'
      }

      if (!eventName) return

      const now = Date.now()
      const key = `${eventName}:${window.location.pathname}`
      const last = lastFiredRef.current[key] || 0
      if (now - last < COOLDOWN_MS) return
      lastFiredRef.current[key] = now

      // No PII: do NOT send phone number or email address.
      ;(window as any).dataLayer = (window as any).dataLayer || []
      ;(window as any).dataLayer.push({
        event: eventName,
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


