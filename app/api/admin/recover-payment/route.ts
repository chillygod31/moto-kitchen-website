import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase/server';
import { createServerAdminClient } from '@/lib/supabase/server-admin';
import { logger } from '@/lib/logging';

function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
  });
}

/**
 * POST /api/admin/recover-payment
 * Manually recover a failed payment or issue a refund
 * 
 * CRITICAL: Requires authentication and admin/owner role
 * 
 * Actions:
 * - create_order: Manually trigger webhook processing to create order
 * - refund: Issue refund via Stripe
 */
export async function POST(req: NextRequest) {
  try {
    // CRITICAL: Verify authentication
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check user has admin/owner role
    const { data: membership } = await supabase
      .from('tenant_members')
      .select('role, tenant_id')
      .eq('user_id', user.id)
      .single();
    
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { session_id, action } = await req.json();
    
    if (!session_id || !action) {
      return NextResponse.json(
        { error: 'Missing session_id or action' },
        { status: 400 }
      );
    }
    
    const stripe = getStripeClient();
    const adminSupabase = createServerAdminClient();
    
    // Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }
    
    const tenantId = session.metadata?.tenant_id || membership.tenant_id;
    
    if (action === 'create_order') {
      // Check if order already exists
      const { data: existing } = await adminSupabase
        .from('orders')
        .select('id, order_number')
        .eq('stripe_session_id', session_id)
        .eq('payment_status', 'paid')
        .single();
      
      if (existing) {
        return NextResponse.json({
          status: 'already_exists',
          order_id: existing.id,
          order_number: existing.order_number,
          message: 'Order already exists and is paid'
        });
      }
      
      // Manually trigger webhook processing
      const { data: result, error } = await adminSupabase.rpc('process_webhook_atomically', {
        p_event_id: `manual_recovery_${Date.now()}`,
        p_session_id: session.id,
        p_payment_intent: session.payment_intent as string,
        p_tenant_id: tenantId
      });
      
      if (error) {
        throw new Error(`Recovery failed: ${error.message}`);
      }
      
      // Acknowledge the alert
      await adminSupabase
        .from('webhook_alerts')
        .update({
          acknowledged: true,
          acknowledged_by: user.id,
          acknowledged_at: new Date().toISOString()
        })
        .eq('session_id', session_id)
        .eq('acknowledged', false);
      
      logger.info('Order manually recovered', {
        sessionId: session_id,
        orderId: result.order_id,
        orderNumber: result.order_number,
        recoveredBy: user.id
      });
      
      return NextResponse.json({
        status: 'recovered',
        order_id: result.order_id,
        order_number: result.order_number,
        message: 'Order created successfully. Confirmation emails have been queued.'
      });
      
    } else if (action === 'refund') {
      // Issue refund via Stripe
      const refund = await stripe.refunds.create({
        payment_intent: session.payment_intent as string,
        reason: 'requested_by_customer'
      });
      
      // Update order if it exists
      await adminSupabase
        .from('orders')
        .update({
          payment_status: 'refunded',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_session_id', session_id);
      
      // Acknowledge alert
      await adminSupabase
        .from('webhook_alerts')
        .update({
          acknowledged: true,
          acknowledged_by: user.id,
          acknowledged_at: new Date().toISOString()
        })
        .eq('session_id', session_id)
        .eq('acknowledged', false);
      
      logger.info('Refund issued via recovery', {
        sessionId: session_id,
        refundId: refund.id,
        issuedBy: user.id
      });
      
      return NextResponse.json({
        status: 'refunded',
        refund_id: refund.id,
        message: 'Refund issued successfully'
      });
      
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "create_order" or "refund"' },
        { status: 400 }
      );
    }
    
  } catch (error: any) {
    logger.error('Recovery action failed', error as Error);
    return NextResponse.json(
      { error: 'Recovery failed', message: error.message },
      { status: 500 }
    );
  }
}

