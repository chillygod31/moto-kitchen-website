/**
 * Create Supabase client for server-side routes with authentication
 * Uses anon key + JWT session from cookies
 * 
 * Use this for admin routes that require authentication
 * RLS policies will enforce tenant isolation based on JWT
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

/**
 * Create authenticated Supabase client for server-side use
 * Reads JWT session from cookies
 */
export async function createServerAuthClient() {
  const cookieStore = await cookies()
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  }

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options?: any) {
        try {
          cookieStore.set(name, value, options)
        } catch (error) {
          // Cookie set failed (e.g., in middleware)
          // This is expected in some contexts
        }
      },
      remove(name: string, options?: any) {
        try {
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        } catch (error) {
          // Cookie remove failed
        }
      },
    },
  })
}

/**
 * Create authenticated Supabase client from request
 * Use this in API routes when you have access to the request object
 */
export async function createServerAuthClientFromRequest(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options?: any) {
        // In API routes, we'll set cookies via response
        // This is a no-op here - use response.cookies.set() instead
      },
      remove(name: string, options?: any) {
        // Use response.cookies.delete() instead
      },
    },
  })
}

