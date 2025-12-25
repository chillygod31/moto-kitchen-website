/**
 * Error tracking utility
 * 
 * Wraps error tracking service (e.g., Sentry).
 * For now, provides a simple interface that can be extended
 * to integrate with Sentry or other error tracking services.
 */

import { getTenantContextFromHeaders } from './logging'

interface ErrorContext {
  tenantId?: string
  tenantSlug?: string
  requestId?: string
  userId?: string
  path?: string
  [key: string]: unknown
}

/**
 * Capture exception for error tracking
 * 
 * @param error - Error object
 * @param context - Additional context
 */
export function captureException(error: Error, context?: ErrorContext) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error captured:', error, context)
  }

  // TODO: Integrate with Sentry or other error tracking service
  // Example Sentry integration:
  // Sentry.captureException(error, {
  //   contexts: {
  //     custom: context,
  //   },
  //   tags: {
  //     tenant: context?.tenantSlug,
  //   },
  // })
}

/**
 * Capture message for error tracking
 * 
 * @param message - Error message
 * @param level - Error level (default: 'error')
 * @param context - Additional context
 */
export function captureMessage(
  message: string,
  level: 'error' | 'warning' | 'info' = 'error',
  context?: ErrorContext
) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const logMethod = level === 'error' ? console.error : level === 'warning' ? console.warn : console.log
    logMethod('Message captured:', message, context)
  }

  // TODO: Integrate with Sentry or other error tracking service
  // Example Sentry integration:
  // Sentry.captureMessage(message, {
  //   level,
  //   contexts: {
  //     custom: context,
  //   },
  //   tags: {
  //     tenant: context?.tenantSlug,
  //   },
  // })
}

/**
 * Wrap API route handler with error tracking
 * 
 * @param handler - API route handler function
 * @param getContext - Function to extract context from request
 */
export function withErrorTracking<T extends Request>(
  handler: (request: T) => Promise<Response>,
  getContext?: (request: T) => ErrorContext
) {
  return async (request: T): Promise<Response> => {
    try {
      const context = getContext ? getContext(request) : getTenantContextFromHeaders(request.headers)
      return await handler(request)
    } catch (error) {
      const context = getContext ? getContext(request) : getTenantContextFromHeaders(request.headers)
      
      if (error instanceof Error) {
        captureException(error, context)
      } else {
        captureMessage(String(error), 'error', context)
      }

      // Re-throw to let Next.js handle it
      throw error
    }
  }
}

