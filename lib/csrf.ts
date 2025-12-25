/**
 * CSRF protection utility
 * 
 * Generates and validates CSRF tokens for admin mutation routes.
 * Uses a simple token-based approach suitable for server-side rendered apps.
 */

import { cookies } from 'next/headers'

const CSRF_TOKEN_COOKIE = 'csrf-token'
const CSRF_HEADER = 'x-csrf-token'

/**
 * Generate a random CSRF token
 */
function generateToken(): string {
  // Use crypto.randomBytes for secure random token
  // In Node.js environment, we can use crypto
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    return array[0].toString(36) + Date.now().toString(36)
  }
  
  // Fallback (less secure, but works)
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36)
}

/**
 * Get or create CSRF token
 * Returns existing token from cookie or generates a new one
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies()
  const existingToken = cookieStore.get(CSRF_TOKEN_COOKIE)?.value

  if (existingToken) {
    return existingToken
  }

  // Generate new token
  const newToken = generateToken()
  cookieStore.set(CSRF_TOKEN_COOKIE, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  })

  return newToken
}

/**
 * Verify CSRF token from request
 * 
 * @param request - Next.js request object
 * @returns true if token is valid, false otherwise
 */
export async function verifyCsrfToken(request: Request): Promise<boolean> {
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(CSRF_TOKEN_COOKIE)?.value
  const headerToken = request.headers.get(CSRF_HEADER)

  if (!cookieToken || !headerToken) {
    return false
  }

  // Tokens must match
  return cookieToken === headerToken
}

/**
 * Get CSRF token for client-side use
 * This should be called from a server component or API route
 * and passed to the client as a prop or in initial data
 */
export async function getCsrfTokenForClient(): Promise<string> {
  return getCsrfToken()
}

