'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface AdminHeaderProps {
  logoUrl?: string | null
  tenantName?: string
}

export default function AdminHeader({ logoUrl, tenantName = 'Admin' }: AdminHeaderProps) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' })
      router.push('/admin/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
      router.push('/admin/login')
    } finally {
      setLoggingOut(false)
    }
  }

  // Use default logo if no logo URL provided
  const displayLogoUrl = logoUrl || '/logo1.png'

  return (
    <header className="bg-[#3A2A24] sticky top-0 z-50 h-[90px]">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <Link href="/admin/quotes" className="flex items-center h-full py-2 gap-0">
          <Image
            src={displayLogoUrl}
            alt={tenantName}
            width={80}
            height={80}
            className="h-16 md:h-20 max-h-full object-contain"
            priority
          />
          <div className="flex flex-col -ml-2">
            <span className="text-white text-lg md:text-xl leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              {tenantName}
            </span>
            <span className="text-white/80 text-[8px] md:text-[10px] uppercase tracking-[0.15em] leading-tight" style={{ fontFamily: 'var(--font-cinzel)' }}>
              Admin Dashboard
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white border border-white/20 rounded-md hover:bg-white/10 transition disabled:opacity-50"
            style={{ fontFamily: 'var(--font-cinzel), serif' }}
          >
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
    </header>
  )
}

