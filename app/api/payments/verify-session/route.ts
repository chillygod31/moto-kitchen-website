import { NextRequest, NextResponse } from 'next/server';
import { createServerAdminClient } from '@/lib/supabase/server-admin';
import { logger } from '@/lib/logging';

/**
 * GET /api/payments/verify-session
 * Verify the status of a Stripe checkout session and return order details
 * Used by success page polling to wait for webhook processing
 * 
 * Returns:
 * - not_found: Order doesn't exist yet (webhook not processed)
 * - pending: Order exists but payment not confirmed
 * - paid: Order confirmed and ready to display
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session_id parameter' },
        { status: 400 }
      );
    }
    
    const supabase = createServerAdminClient();
    
    // Find order by session_id
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        payment_status,
        email_status,
        total,
        fulfillment_type,
        scheduled_for,
        customer_name,
        customer_email,
        expires_at,
        created_at,
        order_items (
          id,
          name_snapshot,
          unit_price,
          quantity,
          line_total,
          notes
        )
      `)
      .eq('stripe_session_id', sessionId)
      .single();
    
    if (error || !order) {
      return NextResponse.json({
        order_created: false,
        status: 'not_found',
        message: 'Order is being processed. Please wait...'
      });
    }
    
    // Check if order is still pending
    if (order.payment_status === 'pending') {
      const isExpired = order.expires_at && new Date(order.expires_at) < new Date();
      
      return NextResponse.json({
        order_created: true,
        status: 'pending',
        is_expired: isExpired,
        message: isExpired 
          ? 'Payment session expired. Please contact support if you completed payment.'
          : 'Processing your payment...'
      });
    }
    
    // Order is paid
    return NextResponse.json({
      order_created: true,
      status: order.payment_status,
      order: order
    });
    
  } catch (error: any) {
    logger.error('Error verifying session', error as Error);
    return NextResponse.json(
      { error: 'Failed to verify session', message: error.message },
      { status: 500 }
    );
  }
}
