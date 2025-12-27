/**
 * API Route Logging Helper
 * 
 * Optional helper to wrap API route handlers with automatic logging.
 * Can be used to reduce boilerplate in routes, or keep explicit logging per route.
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'

/**
 * Wrap an API route handler with automatic logging
 * 
 * @param handler - The API route handler function
 * @param routeName - The route name for logging (e.g., '/api/orders')
 * @returns Wrapped handler with automatic logging
 * 
 * @example
 * ```typescript
 * export const GET = withApiLogging(
 *   async (request: NextRequest) => {
 *     // Your handler code
 *     return NextResponse.json({ data: 'result' })
 *   },
 *   '/api/orders'
 * )
 * ```
 */
export function withApiLogging(
  handler: (request: NextRequest) => Promise<NextResponse>,
  routeName: string
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const context = getTenantContextFromHeaders(request.headers)
    logger.api.request(request.method, routeName, context)
    
    try {
      const response = await handler(request)
      logger.info(`${request.method} ${routeName} - Success`, context)
      return response
    } catch (error: any) {
      logger.api.error(request.method, routeName, error, context)
      captureException(error, context)
      throw error
    }
  }
}

/**
 * Wrap an API route handler with automatic logging (for dynamic routes)
 * 
 * @param handler - The API route handler function that receives params
 * @param getRouteName - Function to generate route name from params
 * @returns Wrapped handler with automatic logging
 * 
 * @example
 * ```typescript
 * export const GET = withApiLoggingDynamic(
 *   async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
 *     const { id } = await params
 *     // Your handler code
 *     return NextResponse.json({ data: 'result' })
 *   },
 *   async (params) => `/api/orders/${(await params).id}`
 * )
 * ```
 */
export function withApiLoggingDynamic<T extends { params?: Promise<Record<string, string>> }>(
  handler: (request: NextRequest, context: T) => Promise<NextResponse>,
  getRouteName: (params: T['params']) => Promise<string> | string
) {
  return async (request: NextRequest, handlerContext: T): Promise<NextResponse> => {
    const context = getTenantContextFromHeaders(request.headers)
    const routeName = await getRouteName(handlerContext.params)
    logger.api.request(request.method, routeName, context)
    
    try {
      const response = await handler(request, handlerContext)
      logger.info(`${request.method} ${routeName} - Success`, context)
      return response
    } catch (error: any) {
      logger.api.error(request.method, routeName, error, context)
      captureException(error, context)
      throw error
    }
  }
}

