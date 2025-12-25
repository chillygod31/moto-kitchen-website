import { createClient } from '@supabase/supabase-js'

/**
 * Create Supabase client for server-side admin routes
 * Uses service role key - bypasses RLS (use with tenant isolation in app code)
 * 
 * Use this ONLY for:
 * - /api/admin/* routes
 * - Admin dashboard server components
 * - Internal admin operations that require elevated privileges
 * 
 * NEVER use for customer-facing routes - use server-app.ts instead
 */
export function createServerAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

