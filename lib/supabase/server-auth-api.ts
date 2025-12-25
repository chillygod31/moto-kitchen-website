/**
 * Helper for creating authenticated Supabase clients in API routes
 * Properly handles cookies for request/response cycle
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Create authenticated Supabase client for API routes
 * Returns both client and response handler for setting cookies
 */
export function createServerAuthClientForApi(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const response = NextResponse.next()

  const supabase = createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        // Set cookie in response
        response.cookies.set(name, value, options)
      },
      remove(name: string, options: any) {
        // Remove cookie in response
        response.cookies.set(name, '', { ...options, maxAge: 0 })
      },
    },
  })

  return { supabase, response }
}

