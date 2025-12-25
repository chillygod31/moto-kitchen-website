/**
 * Rate limiting utility
 * 
 * Simple in-memory rate limiting for API endpoints.
 * For production at scale, consider using Redis or a dedicated rate limiting service.
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

// In-memory store (clears on server restart)
// In production, use Redis or similar for distributed systems
const store: RateLimitStore = {}

interface RateLimitOptions {
  maxRequests: number
  windowMs: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Rate limit check
 * 
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param options - Rate limit options
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const { maxRequests, windowMs } = options
  const now = Date.now()
  const key = identifier

  // Clean up expired entries periodically (every 1000 requests)
  if (Math.random() < 0.001) {
    cleanupExpiredEntries(now)
  }

  const entry = store[key]

  if (!entry || entry.resetAt < now) {
    // First request or window expired, create new entry
    store[key] = {
      count: 1,
      resetAt: now + windowMs,
    }
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    }
  }

  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  // Increment count
  entry.count++
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Clean up expired entries from store
 */
function cleanupExpiredEntries(now: number) {
  for (const key in store) {
    if (store[key].resetAt < now) {
      delete store[key]
    }
  }
}

/**
 * Get client identifier from request
 * Uses IP address, falling back to a default identifier
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (set by proxy/load balancer)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback (in development)
  return 'unknown'
}

/**
 * Predefined rate limit configurations
 */
export const rateLimitConfigs = {
  orderCreation: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  checkout: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  },
  quoteSubmit: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  },
} as const

/**
 * Rate limit middleware helper
 * Returns NextResponse with rate limit headers if exceeded
 */
export function rateLimitMiddleware(
  request: Request,
  config: RateLimitOptions
): { allowed: boolean; response?: Response; remaining: number; resetAt: number } {
  const identifier = getClientIdentifier(request)
  const result = checkRateLimit(identifier, config)

  if (!result.allowed) {
    const response = new Response(
      JSON.stringify({
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetAt.toString(),
          'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
        },
      }
    )
    return {
      allowed: false,
      response,
      remaining: result.remaining,
      resetAt: result.resetAt,
    }
  }

  return {
    allowed: true,
    remaining: result.remaining,
    resetAt: result.resetAt,
  }
}

