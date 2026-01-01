import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { getTenantId } from '@/lib/tenant'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'

function getStripeClient() {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
  if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set')
  }
  return new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  })
}

/**
 * POST /api/payments/create-session
 * Create a Stripe Checkout session for an order
 * 
 * P0 CRITICAL CHANGES:
 * 1. Creates Stripe session FIRST (can fail without side effects)
 * 2. Then creates pending order + books slot atomically via RPC
 * 3. If RPC fails, expires Stripe session (rollback)
 * 4. No orphaned slot reservations possible
 */
export async function POST(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('POST', '/api/payments/create-session', context)
  
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key not configured')
    }

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
      selectedTimeSlot,
    } = body

    // Validate required fields
    if (!customerName || !customerPhone || !cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServerAdminClient()
    const tenantId = await getTenantId()

    // Get tenant info for metadata
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name, slug')
      .eq('id', tenantId)
      .single()

    // Build order data for pending order creation
    const orderData = {
      customer_name: customerName,
      customer_email: customerEmail || '',
      customer_phone: customerPhone,
      fulfillment_type: fulfillmentType,
      scheduled_for: scheduledFor || '',
      delivery_address: deliveryAddress || '',
      postcode: postcode || '',
      city: city || '',
      subtotal: subtotal.toString(),
      delivery_fee: (deliveryFee || 0).toString(),
      service_fee: (serviceFee || 0).toString(),
      admin_fee: (adminFee || 0).toString(),
      total: total.toString(),
      notes: notes || '',
      cart_items: cartItems.map((item: any) => ({
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    }

    let pendingOrder: any = null
    let stripeSession: Stripe.Checkout.Session | null = null

    try {
      // STEP 1: Create Stripe session FIRST (can fail without side effects)
      const stripe = getStripeClient()
      
      // Build line items for Stripe
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cartItems.map((item: any) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name,
            description: item.description || undefined,
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      }))

      // Add delivery fee if applicable
      if (deliveryFee > 0) {
        lineItems.push({
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Delivery Fee',
            },
            unit_amount: Math.round(deliveryFee * 100),
          },
          quantity: 1,
        })
      }

      // Add service fee if applicable
      if (serviceFee > 0) {
        lineItems.push({
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Service Fee',
            },
            unit_amount: Math.round(serviceFee * 100),
          },
          quantity: 1,
        })
      }

      // Add admin fee if applicable
      if (adminFee > 0) {
        lineItems.push({
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Admin Fee',
            },
            unit_amount: Math.round(adminFee * 100),
          },
          quantity: 1,
        })
      }

      stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: customerEmail || undefined,
        line_items: lineItems,
        success_url: `${request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/order/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/order/checkout?canceled=true`,
        metadata: {
          tenant_id: tenantId,
          tenant_slug: tenant?.slug || 'moto-kitchen',
          customer_name: customerName,
          customer_phone: customerPhone,
        },
        expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
      })

      logger.info('Stripe checkout session created', { 
        ...context, 
        tenantId, 
        sessionId: stripeSession.id,
        amount: total 
      })

      // STEP 2: Create pending order + book slot (atomic via RPC)
      // Pass Stripe expiry time to align order expiry with Stripe session expiry
      const stripeExpiresAt = new Date(stripeSession.expires_at * 1000).toISOString()
      
      const { data, error: orderError } = await supabase.rpc('create_pending_order_with_slot', {
        p_tenant_id: tenantId,
        p_session_id: stripeSession.id,
        p_slot_id: selectedTimeSlot || null,
        p_order_data: orderData,
        p_stripe_expires_at: stripeExpiresAt
      })

      if (orderError) {
        throw new Error(`Failed to create pending order: ${orderError.message}`)
      }

      pendingOrder = data[0]

      logger.info('Pending order created with Stripe session', {
        ...context,
        tenantId,
        sessionId: stripeSession.id,
        orderId: pendingOrder.order_id,
        orderNumber: pendingOrder.order_number,
        slotBooked: pendingOrder.slot_booked
      })

      return NextResponse.json({
        sessionId: stripeSession.id,
        url: stripeSession.url,
        orderId: pendingOrder.order_id,
        orderNumber: pendingOrder.order_number
      })

    } catch (error: any) {
      logger.error('Failed to create checkout session or pending order', error, { ...context, tenantId })

      // ROLLBACK: If we created Stripe session but DB failed, expire it
      if (stripeSession && !pendingOrder) {
        try {
          const stripe = getStripeClient()
          await stripe.checkout.sessions.expire(stripeSession.id)
          logger.info('Expired Stripe session due to order creation failure', {
            ...context,
            sessionId: stripeSession.id
          })
        } catch (expireError) {
          logger.error('Failed to expire Stripe session during rollback', expireError as Error, {
            ...context,
            sessionId: stripeSession.id
          })
        }
      }

      // Note: If DB transaction fails, slot booking will auto-rollback
      // because create_pending_order_with_slot is a single atomic transaction

      throw error // Re-throw to outer catch
    }
  } catch (error: any) {
    logger.api.error('POST', '/api/payments/create-session', error, context)
    captureException(error, context)
    return NextResponse.json(
      { 
        message: 'Failed to create payment session',
        error: error.message 
      },
      { status: 500 }
    )
  }
}
