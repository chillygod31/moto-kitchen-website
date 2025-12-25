/**
 * Client-side authentication helpers for Supabase Auth
 * 
 * These functions work with Supabase Auth on the client side.
 * Use these in client components and browser contexts.
 */

'use client'

import { createClient } from '@/lib/supabase/client'

/**
 * Get authenticated user (client-side)
 * 
 * @returns User object or null if not authenticated
 */
export async function getClientUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

/**
 * Get current session (client-side)
 * 
 * @returns Session object or null
 */
export async function getClientSession() {
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    return null
  }
  
  return session
}

/**
 * Sign in with email and password
 * 
 * @param email - User email
 * @param password - User password
 * @returns User and session or error
 */
export async function signIn(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    return { error }
  }
  
  return { user: data.user, session: data.session }
}

/**
 * Sign out (client-side)
 */
export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
}

