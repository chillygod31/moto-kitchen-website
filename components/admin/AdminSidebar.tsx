'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon?: React.ReactNode
}

const navItems: NavItem[] = [
  { href: '/admin/quotes', label: 'Quotes' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/menu', label: 'Menu' },
  { href: '/admin/settings', label: 'Settings' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen pt-[90px] fixed left-0 top-0">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition
                ${
                  isActive
                    ? 'bg-[var(--brand-primary,#C9653B)]/10 text-[var(--brand-primary,#C9653B)]'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
              style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 500 }}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

