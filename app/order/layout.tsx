import type { Metadata } from 'next'
import OrderPasswordProtection from './components/OrderPasswordProtection'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
}

export default function OrderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OrderPasswordProtection>
      {children}
    </OrderPasswordProtection>
  )
}

