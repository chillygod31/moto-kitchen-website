import { Resend } from 'resend';
import { createServerAdminClient } from '@/lib/supabase/server-admin';
import { logger } from '@/lib/logging';
import { getTenantEmailAddresses, getAdminFromAddress } from '@/lib/email-helpers';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWebhookFailureAlert(params: {
  sessionId: string;
  eventId: string;
  tenantId: string;
  error: string;
  amount: number;
  orderId?: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const supabase = createServerAdminClient();
  
  // Get proper admin alert email from tenant settings
  const { adminAlert } = await getTenantEmailAddresses(params.tenantId);
  
  // Log to alerts table first (even if email fails)
  try {
    await supabase.from('webhook_alerts').insert({
      tenant_id: params.tenantId,
      alert_type: 'webhook_failure',
      severity: 'critical',
      session_id: params.sessionId,
      order_id: params.orderId,
      error_message: params.error,
      metadata: {
        event_id: params.eventId,
        amount: params.amount,
        alert_email_attempted: true
      }
    });
  } catch (dbError) {
    logger.error('Failed to log webhook alert to database', dbError as Error);
  }
  
  // Attempt to send email
  try {
    await resend.emails.send({
      from: getAdminFromAddress(),
      to: adminAlert,
      replyTo: adminAlert, // Replies go back to admin
      subject: `🚨 URGENT: Payment Completed But Order Failed - ${params.sessionId}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2 style="color: #d32f2f; margin-bottom: 16px;">
            ⚠️ CRITICAL: Webhook Processing Failed
          </h2>
          <p style="font-size: 16px; margin-bottom: 24px;">
            <strong>A customer's payment was successful but the order failed to create.</strong>
          </p>
          
          <div style="background: #fff3cd; border-left: 4px solid #ff9800; padding: 16px; margin: 24px 0;">
            <h3 style="margin-top: 0;">Details:</h3>
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="padding: 4px 0;"><strong>Session ID:</strong></td>
                <td style="padding: 4px 0; font-family: monospace;">${params.sessionId}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Event ID:</strong></td>
                <td style="padding: 4px 0; font-family: monospace;">${params.eventId}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Amount:</strong></td>
                <td style="padding: 4px 0;">€${params.amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; vertical-align: top;"><strong>Error:</strong></td>
                <td style="padding: 4px 0; color: #d32f2f;">${params.error}</td>
              </tr>
            </table>
          </div>
          
          <h3>Action Required:</h3>
          <p>This order needs immediate attention. Customer has paid but no order exists in the system.</p>
          
          <div style="margin: 24px 0;">
            <a href="${siteUrl}/admin/recovery?session=${params.sessionId}" 
               style="display: inline-block; padding: 12px 24px; background: #d32f2f; color: white; text-decoration: none; border-radius: 4px; font-weight: 600;">
              Resolve in Admin Panel →
            </a>
          </div>
          
          <p style="margin-top: 24px;">
            <a href="https://dashboard.stripe.com/test/events/${params.eventId}" 
               style="color: #1976d2;">
              View in Stripe Dashboard →
            </a>
          </p>
          
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>
              <strong>Note:</strong> Stripe will automatically retry this webhook. 
              If the issue persists, use the admin recovery tool to manually create 
              the order or issue a refund.
            </p>
          </div>
        </div>
      `
    });
    
    logger.info('Webhook failure alert sent', { sessionId: params.sessionId });
  } catch (emailError) {
    logger.error('CRITICAL: Failed to send webhook alert email', emailError as Error, {
      sessionId: params.sessionId,
      adminEmail: adminAlert
    });
    
    // Update alert to note email failure
    try {
      await supabase
        .from('webhook_alerts')
        .update({
          metadata: {
            event_id: params.eventId,
            amount: params.amount,
            alert_email_failed: true,
            email_error: (emailError as Error).message
          }
        })
        .eq('session_id', params.sessionId)
        .eq('alert_type', 'webhook_failure');
    } catch {}
  }
}

