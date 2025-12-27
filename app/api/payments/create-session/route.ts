import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { getTenantId } from '@/lib/tenant'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

/**
 * POST /api/payments/create-session
 * Create a Stripe Checkout session for an order
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

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
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
        customer_email: customerEmail || '',
        customer_phone: customerPhone,
        fulfillment_type: fulfillmentType,
        delivery_address: deliveryAddress || '',
        postcode: postcode || '',
        city: city || '',
        scheduled_for: scheduledFor || '',
        notes: notes || '',
        // Store only minimal cart data (IDs and quantities) to stay under 500 char limit
        // Format: "id1:qty1,id2:qty2,..."
        cart_items: cartItems.map((item: any) => `${item.id}:${item.quantity}`).join(','),
        subtotal: subtotal.toString(),
        delivery_fee: deliveryFee.toString(),
        service_fee: serviceFee.toString(),
        admin_fee: adminFee.toString(),
        total: total.toString(),
      },
      // Store order data in session for webhook processing
      payment_intent_data: {
        metadata: {
          tenant_id: tenantId,
          customer_name: customerName,
          customer_phone: customerPhone,
        },
      },
    })

    logger.info('Stripe checkout session created', { 
      ...context, 
      tenantId, 
      sessionId: session.id,
      amount: total 
    })

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })
  } catch (error: any) {
    logger.api.error('POST', '/api/payments/create-session', error, context)
    captureException(error, context)
    return NextResponse.json(
      { message: 'Failed to create payment session', error: error.message },
      { status: 500 }
    )
  }
}

