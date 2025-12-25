/**
 * Server-side authentication helpers for Supabase Auth
 * 
 * These functions work with Supabase Auth on the server side.
 * Use these in API routes and server components.
 */

import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { createServerAppClient } from '@/lib/supabase/server-app'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

/**
 * Get authenticated user from request
 * Uses Supabase Auth session stored in cookies
 * 
 * @param request - Next.js request object
 * @returns User object or null if not authenticated
 */
export async function getServerUser(request?: NextRequest) {
  const supabase = createServerAppClient()
  
  // Get session from cookies
  const cookieStore = await cookies()
  
  if (request) {
    // Extract cookies from request
    const authToken = request.cookies.get('sb-access-token')?.value
    const refreshToken = request.cookies.get('sb-refresh-token')?.value
    
    if (authToken) {
      const { data: { user }, error } = await supabase.auth.getUser(authToken)
      if (!error && user) {
        return user
      }
    }
  } else {
    // Use server-side cookie access
    const { data: { user }, error } = await supabase.auth.getUser()
    if (!error && user) {
      return user
    }
  }
  
  return null
}

/**
 * Require authentication - throws error if not authenticated
 * 
 * @param request - Next.js request object
 * @returns User object (never null)
 * @throws Error if not authenticated
 */
export async function requireAuth(request?: NextRequest) {
  const user = await getServerUser(request)
  
  if (!user) {
    throw new Error('Unauthorized: Authentication required')
  }
  
  return user
}

/**
 * Get user's session
 * 
 * @param request - Next.js request object
 * @returns Session object or null
 */
export async function getServerSession(request?: NextRequest) {
  const supabase = createServerAppClient()
  
  if (request) {
    const authToken = request.cookies.get('sb-access-token')?.value
    if (authToken) {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (!error && session) {
        return session
      }
    }
  } else {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (!error && session) {
      return session
    }
  }
  
  return null
}

