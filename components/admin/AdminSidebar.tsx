'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon?: React.ReactNode
}

interface NavGroup {
  title: string
  items: NavItem[]
}

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const navGroups: NavGroup[] = [
  {
    title: 'Leads',
    items: [
      { href: '/admin/quotes', label: 'Quotes' },
      { href: '/admin/invoice', label: 'Generate Invoice' },
      { href: '/admin/calendar', label: 'Calendar' },
    ]
  },
  {
    title: 'Sales & Orders',
    items: [
      { href: '/admin/orders', label: 'Orders' },
      { href: '/admin/customers', label: 'Customers' },
      { href: '/admin/recovery', label: 'Payment Recovery' },
    ]
  },
  {
    title: 'Operations',
    items: [
      { href: '/admin/menu', label: 'Menu' },
      { href: '/admin/inventory', label: 'Inventory' },
      { href: '/admin/time-slots', label: 'Time Slots' },
      { href: '/admin/emails', label: 'Email Monitoring' },
      { href: '/admin/events', label: 'Event Planner' },
    ]
  },
  {
    title: 'Analytics',
    items: [
      { href: '/admin/analytics', label: 'Reports & Analytics' },
    ]
  },
  {
    title: 'Settings',
    items: [
      { href: '/admin/settings', label: 'Business Settings' },
      { href: '/admin/staff', label: 'Staff Management' },
    ]
  }
]

export default function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        w-64 bg-white border-r border-gray-200 min-h-screen pt-[90px] fixed left-0 top-0 z-50
        transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <nav className="p-4 pb-20 space-y-6 overflow-y-auto h-[calc(100vh-90px)]">
          {navGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              <h3 
                className="px-2 text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider mb-2"
                style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 600 }}
              >
                {group.title}
              </h3>
              <div className="space-y-1 pl-2">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
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
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}

