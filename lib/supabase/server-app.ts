import { createClient } from '@supabase/supabase-js'

/**
 * Create Supabase client for server-side customer-facing routes
 * Uses anon key - RLS will enforce tenant isolation
 * 
 * Use this for:
 * - /api/menu
 * - /api/time-slots
 * - /api/delivery-zones
 * - Customer-facing API routes
 * 
 * DO NOT use for admin routes - use server-admin.ts instead
 */
export function createServerAppClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

