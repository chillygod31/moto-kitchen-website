import { NextRequest, NextResponse } from 'next/server'
import { createServerAuthClient } from '@/lib/supabase/server-auth'
import { getAdminTenantId } from '@/lib/auth/server-admin'
import { updateOrderStatusSchema } from '@/lib/validations/admin'
import { verifyCsrfToken } from '@/lib/csrf'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'

/**
 * GET /api/orders/[id]
 * Get a single order by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = getTenantContextFromHeaders(request.headers)
  const { id } = await params
  logger.api.request('GET', `/api/orders/${id}`, context)
  
  try {
    // Use JWT-based client so RLS policies apply
    const supabase = await createServerAuthClient()
    
    // Get tenant ID from admin session (server-side, secure)
    const tenantId = await getAdminTenantId(request)

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      logger.api.error('GET', `/api/orders/${id}`, error as Error, { ...context, tenantId, orderId: id })
      captureException(error as Error, { ...context, tenantId, orderId: id })
      return NextResponse.json(
        { message: 'Order not found', error: error.message },
        { status: 404 }
      )
    }

    logger.info('Order fetched successfully', { ...context, tenantId, orderId: id })
    return NextResponse.json(data)
  } catch (error: any) {
    logger.api.error('GET', `/api/orders/${id}`, error, context)
    captureException(error, context)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/orders/[id]
 * Update order status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = getTenantContextFromHeaders(request.headers)
  const { id } = await params
  logger.api.request('PATCH', `/api/orders/${id}`, context)
  
  // Verify CSRF token
  const isValidCsrf = await verifyCsrfToken(request)
  if (!isValidCsrf) {
    logger.warn('CSRF token missing or invalid', { ...context, path: `/api/orders/${id}` })
    return NextResponse.json(
      { message: 'CSRF token missing or invalid' },
      { status: 403 }
    )
  }

  try {
    // Use JWT-based client so RLS policies apply
    const supabase = await createServerAuthClient()
    
    // Get tenant ID from admin session (server-side, secure)
    const tenantId = await getAdminTenantId(request)
    const body = await request.json()

    // Validate request body
    const validationResult = updateOrderStatusSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: 'Validation failed', 
          errors: validationResult.error.issues.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*, order_items(*)')
      .single()

    if (error) {
      logger.api.error('PATCH', `/api/orders/${id}`, error as Error, { ...context, tenantId, orderId: id })
      captureException(error as Error, { ...context, tenantId, orderId: id })
      return NextResponse.json(
        { message: 'Failed to update order', error: error.message },
        { status: 500 }
      )
    }

    logger.info('Order updated successfully', { ...context, tenantId, orderId: id })
    return NextResponse.json(data)
  } catch (error: any) {
    logger.api.error('PATCH', `/api/orders/${id}`, error, context)
    captureException(error, context)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

