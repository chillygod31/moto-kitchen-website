// Login page layout - bypasses parent admin layout auth check
// This prevents redirect loops when accessing /admin/login
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Return children without any auth check or admin UI
  return <>{children}</>
}

