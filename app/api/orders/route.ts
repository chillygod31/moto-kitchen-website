import { NextRequest, NextResponse } from 'next/server'
import { createServerAuthClient } from '@/lib/supabase/server-auth'
import { createServerAppClient } from '@/lib/supabase/server-app'
import { getTenantId } from '@/lib/tenant'
import { getAdminTenantId } from '@/lib/auth/server-admin'
import { generateOrderNumber, extractPostcodePrefix, checkMinimumOrder } from '@/lib/utils'
import { createOrderSchema } from '@/lib/validations/orders'
import { rateLimitMiddleware, rateLimitConfigs } from '@/lib/rate-limit'

/**
 * GET /api/orders
 * Get all orders for the tenant (admin only)
 * Uses admin session for tenant context
 */
export async function GET(request: NextRequest) {
  try {
    // Use JWT-based client so RLS policies apply
    const supabase = await createServerAuthClient()
    
    // Get tenant ID from admin session (server-side, secure)
    // Admin routes require authentication
    const tenantId = await getAdminTenantId(request)

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json(
        { message: 'Failed to fetch orders', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Error in GET /api/orders:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/orders
 * Create a new order
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimit = rateLimitMiddleware(request, rateLimitConfigs.orderCreation)
  if (!rateLimit.allowed) {
    return rateLimit.response as NextResponse
  }

  try {
    const supabase = createServerAppClient()
    const tenantId = await getTenantId()

    const body = await request.json()
    
    // Validate request body
    const validationResult = createOrderSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: 'Validation failed', 
          errors: validationResult.error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }
    
    const {
      customerName,
      customerEmail,
      customerPhone,
      fulfillmentType,
      deliveryAddress,
      postcode,
      city,
      scheduledFor,
      cartItems,
      subtotal,
      deliveryFee,
      serviceFee,
      adminFee,
      total,
      notes,
    } = validationResult.data

    // Validate minimum order
    const { data: businessSettings } = await supabase
      .from('tenant_business_settings')
      .select('min_order_value')
      .eq('tenant_id', tenantId)
      .single()

    const minOrderValue = businessSettings?.min_order_value || 0
    if (minOrderValue > 0) {
      const minOrderCheck = checkMinimumOrder(subtotal, minOrderValue)
      if (!minOrderCheck.valid) {
        return NextResponse.json(
          { message: minOrderCheck.message },
          { status: 400 }
        )
      }
    }

    const orderNumber = generateOrderNumber()

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tenant_id: tenantId,
        order_number: orderNumber,
        customer_name: customerName,
        customer_email: customerEmail || null,
        customer_phone: customerPhone,
        fulfillment_type: fulfillmentType,
        scheduled_for: scheduledFor,
        delivery_address: fulfillmentType === 'delivery' ? deliveryAddress : null,
        postcode: fulfillmentType === 'delivery' ? postcode : null,
        city: fulfillmentType === 'delivery' ? city : null,
        subtotal,
        delivery_fee: deliveryFee || 0,
        service_fee: serviceFee || 0,
        admin_fee: adminFee || 0,
        total,
        status: 'new',
        payment_status: 'unpaid',
        notes: notes || null,
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return NextResponse.json(
        { message: 'Failed to create order', error: orderError.message },
        { status: 500 }
      )
    }

    // Validate menu items exist before creating order items
    const menuItemIds = cartItems.map((item: any) => item.id)
    const { data: existingMenuItems, error: menuCheckError } = await supabase
      .from('menu_items')
      .select('id')
      .eq('tenant_id', tenantId)
      .in('id', menuItemIds)

    if (menuCheckError) {
      console.error('Error checking menu items:', menuCheckError)
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json(
        { message: 'Failed to validate menu items', error: menuCheckError.message },
        { status: 500 }
      )
    }

    if (!existingMenuItems || existingMenuItems.length !== menuItemIds.length) {
      const existingIds = existingMenuItems?.map((m: any) => m.id) || []
      const missingIds = menuItemIds.filter((id: string) => !existingIds.includes(id))
      console.error('Some menu items not found:', missingIds)
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json(
        { message: `Menu items not found: ${missingIds.join(', ')}` },
        { status: 400 }
      )
    }

    // Create order items
    const orderItemsData = cartItems.map((item: any) => ({
      tenant_id: tenantId,
      order_id: order.id,
      menu_item_id: item.id,
      name_snapshot: item.name,
      unit_price: item.price,
      quantity: item.quantity,
      line_total: item.price * item.quantity,
      notes: item.notes || null,
    }))

    const { data: insertedItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData)
      .select()

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      console.error('Order items data attempted:', JSON.stringify(orderItemsData, null, 2))
      console.error('Tenant ID:', tenantId)
      console.error('Order ID:', order.id)
      console.error('Full error object:', JSON.stringify(itemsError, null, 2))
      // Rollback order creation
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json(
        { 
          message: 'Failed to create order items', 
          error: itemsError.message, 
          details: itemsError.details || itemsError.hint || 'No additional details',
          code: itemsError.code
        },
        { status: 500 }
      )
    }

    // Get full order with items
    const { data: fullOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', order.id)
      .single()

    if (fetchError) {
      console.error('Error fetching created order:', fetchError)
    }

    // Add rate limit headers to successful response
    const response = NextResponse.json(fullOrder || order, { status: 201 })
    response.headers.set('X-RateLimit-Limit', rateLimitConfigs.orderCreation.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimit.resetAt.toString())
    return response
  } catch (error: any) {
    console.error('Error in POST /api/orders:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

