import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

/**
 * GET /api/payments/verify-session?session_id=xxx
 * Verify Stripe checkout session and return order details
 */
export async function GET(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('GET', '/api/payments/verify-session', context)
  
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key not configured')
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { message: 'Missing session_id parameter' },
        { status: 400 }
      )
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    })

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { message: 'Payment not completed', payment_status: session.payment_status },
        { status: 400 }
      )
    }

    // Find order by session ID
    const supabase = createServerAdminClient()
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('order_id')
      .eq('stripe_session_id', sessionId)
      .single()

    if (paymentError || !payment) {
      // Order might not be created yet (webhook might be delayed)
      // Return session info so frontend can poll or wait
      return NextResponse.json({
        session_id: sessionId,
        payment_status: session.payment_status,
        order_created: false,
        message: 'Order is being processed. Please wait...',
      })
    }

    // Get order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', payment.order_id)
      .single()

    if (orderError || !order) {
      logger.error('Order not found after payment', { 
        orderId: payment.order_id, 
        sessionId 
      })
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      )
    }

    logger.info('Session verified and order retrieved', { 
      ...context, 
      sessionId, 
      orderId: order.id 
    })

    return NextResponse.json({
      session_id: sessionId,
      payment_status: session.payment_status,
      order_created: true,
      order,
    })
  } catch (error: any) {
    logger.api.error('GET', '/api/payments/verify-session', error, context)
    captureException(error, context)
    return NextResponse.json(
      { message: 'Failed to verify session', error: error.message },
      { status: 500 }
    )
  }
}

