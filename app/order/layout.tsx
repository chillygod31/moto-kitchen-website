import OrderPasswordProtection from './components/OrderPasswordProtection'

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

