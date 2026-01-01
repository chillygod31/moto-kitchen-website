import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServerAdminClient } from '@/lib/supabase/server-admin';
import { getCustomerConfirmationEmail, getAdminAlertEmail, getEmailRecipient } from '@/lib/email-templates';
import { logger } from '@/lib/logging';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/cron/process-email-queue
 * Process pending emails from the queue
 * 
 * - Fetches pending emails (max 10 per run, max 3 attempts)
 * - Gets order details and business settings
 * - Sends via Resend
 * - Updates email_queue status
 * - Logs to cron_job_runs for health monitoring
 * 
 * Protected by CRON_SECRET
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const supabase = createServerAdminClient();
  const jobStart = new Date();
  
  try {
    // Get pending emails (max 10 per run)
    const { data: emails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(10);
    
    if (fetchError) {
      throw fetchError;
    }
    
    let successCount = 0;
    let failCount = 0;
    
    for (const email of emails || []) {
      try {
        // Get order with items and business info
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*),
            tenants!inner (name, business_email, business_phone)
          `)
          .eq('id', email.order_id)
          .single();
        
        if (orderError || !order) {
          throw new Error(`Order not found: ${email.order_id}`);
        }
        
        // Get business settings
        const { data: settings } = await supabase
          .from('tenant_business_settings')
          .select('pickup_address, pickup_instructions')
          .eq('tenant_id', order.tenant_id)
          .single();
        
        // Build email data
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const emailData = {
          orderNumber: order.order_number,
          orderId: order.id,
          customerName: order.customer_name,
          customerEmail: order.customer_email || '',
          customerPhone: order.customer_phone,
          fulfillmentType: order.fulfillment_type as 'pickup' | 'delivery',
          scheduledFor: order.scheduled_for,
          deliveryAddress: order.delivery_address,
          postcode: order.postcode,
          city: order.city,
          pickupAddress: settings?.pickup_address || null,
          pickupInstructions: settings?.pickup_instructions || null,
          items: (order.order_items || []).map((item: any) => ({
            name: item.name_snapshot,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            lineTotal: item.line_total,
            notes: item.notes || null,
          })),
          subtotal: order.subtotal,
          deliveryFee: order.delivery_fee || 0,
          total: order.total,
          notes: order.notes,
          businessName: order.tenants?.name,
          businessEmail: order.tenants?.business_email,
          businessPhone: order.tenants?.business_phone,
          orderUrl: `${siteUrl}/order/order-success?orderId=${order.id}&orderNumber=${order.order_number}`,
          adminUrl: `${siteUrl}/admin/orders/${order.id}`,
          kitchenTicketUrl: `${siteUrl}/admin/orders/${order.id}?print=1`,
          status: order.payment_status === 'paid' ? 'Paid' : 'Pending',
        };
        
        // Generate email content
        let subject: string;
        let html: string;
        let text: string;
        
        if (email.email_type === 'customer_confirmation') {
          const emailContent = getCustomerConfirmationEmail(emailData);
          subject = `Moto Kitchen — Order #${order.order_number} confirmed`;
          html = emailContent.html;
          text = emailContent.text;
        } else {
          const emailContent = getAdminAlertEmail(emailData);
          subject = `New order #${order.order_number} • ${order.fulfillment_type} • ${order.scheduled_for || 'ASAP'}`;
          html = emailContent.html;
          text = emailContent.text;
        }
        
        // Apply test email redirect if configured
        const actualRecipient = getEmailRecipient(email.recipient);
        
        if (!actualRecipient) {
          throw new Error('No valid recipient email');
        }
        
        // Send via Resend
        const { error: sendError } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'orders@motokitchen.nl',
          to: actualRecipient,
          subject: subject,
          html: html,
          text: text,
        });
        
        if (sendError) {
          throw sendError;
        }
        
        // Mark as sent
        await supabase
          .from('email_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            last_attempt_at: new Date().toISOString()
          })
          .eq('id', email.id);
        
        // Update order email status if customer confirmation
        if (email.email_type === 'customer_confirmation') {
          await supabase
            .from('orders')
            .update({
              email_sent_at: new Date().toISOString(),
              email_status: 'sent'
            })
            .eq('id', email.order_id);
        }
        
        successCount++;
        logger.info('Email sent successfully', {
          emailId: email.id,
          orderId: email.order_id,
          type: email.email_type,
          recipient: actualRecipient
        });
        
      } catch (error: any) {
        failCount++;
        const newAttempts = email.attempts + 1;
        const newStatus = newAttempts >= 3 ? 'failed' : 'pending';
        
        logger.error('Failed to send email', error as Error, {
          emailId: email.id,
          orderId: email.order_id,
          attempt: newAttempts
        });
        
        await supabase
          .from('email_queue')
          .update({
            status: newStatus,
            attempts: newAttempts,
            last_attempt_at: new Date().toISOString(),
            error_message: error.message
          })
          .eq('id', email.id);
        
        // Update order email status if failed permanently
        if (newStatus === 'failed' && email.email_type === 'customer_confirmation') {
          await supabase
            .from('orders')
            .update({ email_status: 'failed' })
            .eq('id', email.order_id);
        }
      }
    }
    
    // Log job run
    const duration = Date.now() - jobStart.getTime();
    await supabase.from('cron_job_runs').insert({
      job_name: 'process_email_queue',
      run_at: jobStart.toISOString(),
      duration_ms: duration,
      status: 'success',
      records_processed: successCount + failCount,
      metadata: {
        success_count: successCount,
        fail_count: failCount
      }
    });
    
    logger.info('Email queue processed', {
      total: emails?.length || 0,
      success: successCount,
      failed: failCount,
      duration_ms: duration
    });
    
    return NextResponse.json({
      success: true,
      processed: emails?.length || 0,
      success_count: successCount,
      fail_count: failCount
    });
    
  } catch (error: any) {
    logger.error('Email queue processor failed', error as Error);
    
    // Log failed job run
    const duration = Date.now() - jobStart.getTime();
    await supabase.from('cron_job_runs').insert({
      job_name: 'process_email_queue',
      run_at: jobStart.toISOString(),
      duration_ms: duration,
      status: 'failed',
      error_message: error.message
    });
    
    return NextResponse.json(
      { error: 'Email queue processing failed', message: error.message },
      { status: 500 }
    );
  }
}

