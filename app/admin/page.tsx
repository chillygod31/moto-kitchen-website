import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/auth/server-admin'

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated()

  if (!authenticated) {
    redirect('/admin/login')
  }

  // Redirect authenticated users to the main admin dashboard (quotes)
  redirect('/admin/quotes')
}
