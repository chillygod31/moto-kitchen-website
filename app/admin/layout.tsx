import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { isAdminAuthenticated, getAdminTenantId } from '@/lib/admin-auth'
import { getMergedBranding, generateBrandingCSS } from '@/lib/admin-branding'
import AdminHeader from '@/components/admin/AdminHeader'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { createServerClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get the pathname from headers (set by middleware) to check if we're on login page
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const isLoginPage = pathname === '/admin/login'
  
  // If on login page, skip auth check and return children without admin UI
  if (isLoginPage) {
    const authenticated = await isAdminAuthenticated()
    // If already authenticated and trying to access login, redirect to quotes
    if (authenticated) {
      redirect('/admin/quotes')
    }
    // If not authenticated, show login page without admin layout
    return <>{children}</>
  }
  
  // For all other admin pages, check authentication
  const authenticated = await isAdminAuthenticated()
  
  if (!authenticated) {
    redirect('/admin/login')
  }

  // Get tenant ID and branding
  const tenantId = await getAdminTenantId()
  const branding = await getMergedBranding(tenantId)
  
  // Get tenant name for header
  const supabase = createServerClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', tenantId)
    .single()

  const brandingCSS = generateBrandingCSS(branding)

  return (
    <div className="min-h-screen bg-[var(--brand-background,#FAF6EF)]">
      <style dangerouslySetInnerHTML={{ __html: brandingCSS }} />
      <AdminHeader logoUrl={branding.logo_url} tenantName={tenant?.name || 'Admin'} />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 ml-64 pt-[90px]">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

