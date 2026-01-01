import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerAdminClient } from '@/lib/supabase/server-admin';
import { sendWebhookFailureAlert } from '@/lib/webhook-alerts';
import { logger } from '@/lib/logging';
import { headers } from 'next/headers';

function getStripeClient() {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }
  return new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  });
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * POST /api/payments/webhook
 * Handle Stripe webhook events
 * 
 * P0 CRITICAL CHANGES:
 * 1. Explicit signature verification (security)
 * 2. Calls process_webhook_atomically RPC (all-or-nothing)
 * 3. Sends alert email on failure
 * 4. Returns 500 on error (triggers Stripe retry)
 * 5. Deduplication handled inside RPC via unique constraint
 */
export async function POST(request: NextRequest) {
  try {
    if (!webhookSecret) {
      logger.error('Stripe webhook secret not configured');
      return NextResponse.json(
        { message: 'Webhook secret not configured' },
        { status: 500 }
      );
    }
    
    // Get raw body and signature
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      logger.error('Missing stripe-signature header');
      return NextResponse.json(
        { message: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // CRITICAL: Verify webhook signature
    let event: Stripe.Event;
    try {
      const stripe = getStripeClient();
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logger.info('Webhook signature verified', { eventId: event.id, type: event.type });
    } catch (err: any) {
      logger.error('Webhook signature verification failed', err as Error);
      return NextResponse.json(
        { message: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }
    
    const supabase = createServerAdminClient();
    
    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId = session.metadata?.tenant_id;
      
        if (!tenantId) {
        logger.error('Missing tenant_id in session metadata', undefined, { sessionId: session.id });
        return NextResponse.json(
          { message: 'Missing tenant_id in metadata' },
          { status: 400 }
        );
      }
      
      try {
        // Call atomic webhook processor (handles deduplication internally)
        const { data: result, error } = await supabase.rpc('process_webhook_atomically', {
          p_event_id: event.id,
          p_session_id: session.id,
          p_payment_intent: session.payment_intent as string || '',
          p_tenant_id: tenantId
        });

                    if (error) {
          throw new Error(error.message);
        }
        
        logger.info('Webhook processed successfully', {
          eventId: event.id,
          sessionId: session.id,
          status: result.status,
          orderId: result.order_id,
          orderNumber: result.order_number,
          wasExpired: result.was_expired,
          autoRecovered: result.auto_recovered
        });
        
        // Send CRITICAL alert if order paid but slot is full (needs manual action)
        if (result.status === 'paid_pending_resolution') {
          logger.error('CRITICAL: Order paid after expiry but slot is full', undefined, {
            orderId: result.order_id,
            orderNumber: result.order_number,
            sessionId: session.id
          });
          
          // Send immediate critical alert email
          await sendWebhookFailureAlert({
            sessionId: session.id,
            eventId: event.id,
            tenantId: tenantId,
            error: new Error(`Order #${result.order_number} paid after expiry but slot is now full - requires manual resolution`),
            orderData: {
              orderId: result.order_id,
              orderNumber: result.order_number,
              wasExpired: result.was_expired
            }
          });
        }
        // Send alert if order was expired but auto-recovered
        else if (result.was_expired && result.auto_recovered) {
          logger.warn('Order paid after expiry but auto-recovered', {
            orderId: result.order_id,
            orderNumber: result.order_number
          });
        }
        
        return NextResponse.json({
          received: true,
          status: result.status,
          order_number: result.order_number
        });
        
      } catch (error: any) {
        logger.error('Webhook processing failed', error as Error, {
          eventId: event.id,
          sessionId: session.id
        });
        
        // Send critical alert email
        await sendWebhookFailureAlert({
          sessionId: session.id,
          eventId: event.id,
          tenantId: tenantId,
          error: error.message,
          amount: (session.amount_total || 0) / 100
        });
        
        // Return 500 so Stripe retries
        return NextResponse.json(
          {
            error: 'Webhook processing failed',
            message: error.message
          },
          { status: 500 }
        );
      }
    }
    
    // Handle other event types
    logger.info('Unhandled webhook event type', { type: event.type });
    return NextResponse.json({ received: true });
    
  } catch (error: any) {
    logger.error('Webhook handler error', error as Error);
    return NextResponse.json(
      { message: 'Webhook handler error', error: error.message },
      { status: 500 }
    );
  }
}
