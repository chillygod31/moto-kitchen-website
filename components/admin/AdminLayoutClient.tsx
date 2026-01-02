'use client'

import { useState } from 'react'
import AdminHeader from './AdminHeader'
import AdminSidebar from './AdminSidebar'

interface AdminLayoutClientProps {
  logoUrl?: string | null
  tenantName?: string
  children: React.ReactNode
}

export default function AdminLayoutClient({ logoUrl, tenantName, children }: AdminLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <AdminHeader 
        logoUrl={logoUrl} 
        tenantName={tenantName}
        onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
      <div className="flex">
        <AdminSidebar 
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 lg:ml-64 pt-[90px] min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </>
  )
}

