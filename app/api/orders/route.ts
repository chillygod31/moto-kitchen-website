import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/tenant'
import { generateOrderNumber, extractPostcodePrefix, checkMinimumOrder } from '@/lib/utils'

/**
 * GET /api/orders
 * Get all orders for the tenant (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const tenantId = await getTenantId('moto-kitchen')

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
  try {
    const supabase = createServerClient()
    const tenantId = await getTenantId('moto-kitchen')

    const body = await request.json()
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
    } = body

    // Validation
    if (!customerName || !customerPhone || !cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (fulfillmentType === 'delivery' && (!deliveryAddress || !postcode || !city)) {
      return NextResponse.json(
        { message: 'Delivery address is required for delivery orders' },
        { status: 400 }
      )
    }

    if (!scheduledFor) {
      return NextResponse.json(
        { message: 'Time slot is required' },
        { status: 400 }
      )
    }

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

    // Create order items
    const orderItemsData = cartItems.map((item: any) => ({
      order_id: order.id,
      menu_item_id: item.id,
      name_snapshot: item.name,
      unit_price: item.price,
      quantity: item.quantity,
      line_total: item.price * item.quantity,
      notes: item.notes || null,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      // Rollback order creation
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json(
        { message: 'Failed to create order items', error: itemsError.message },
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

    return NextResponse.json(fullOrder || order, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/orders:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

