import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { getAdminTenantId } from '@/lib/auth/server-admin'
import { getCustomerConfirmationEmail, getEmailRecipient } from '@/lib/email-templates'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * POST /api/orders/[id]/send-confirmation
 * Send order confirmation email to customer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('POST', `/api/orders/${params.id}/send-confirmation`, context)
  
  try {
    const tenantId = await getAdminTenantId(request)
    const supabase = createServerAdminClient()
    const orderId = params.id

    // Get order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      )
    }

    // Get tenant and business settings
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name, business_email, business_phone')
      .eq('id', tenantId)
      .single()

    const { data: businessSettings } = await supabase
      .from('tenant_business_settings')
      .select('pickup_address, pickup_instructions')
      .eq('tenant_id', tenantId)
      .single()

    if (!order.customer_email) {
      return NextResponse.json(
        { message: 'Customer email not available' },
        { status: 400 }
      )
    }

    // Prepare email data
    const emailData = {
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      fulfillmentType: order.fulfillment_type as 'pickup' | 'delivery',
      scheduledFor: order.scheduled_for,
      deliveryAddress: order.delivery_address,
      postcode: order.postcode,
      city: order.city,
      pickupAddress: businessSettings?.pickup_address || null,
      pickupInstructions: businessSettings?.pickup_instructions || null,
      items: (order.order_items || []).map((item: any) => ({
        name: item.name_snapshot,
        quantity: item.quantity,
        price: item.unit_price,
        lineTotal: item.line_total,
      })),
      subtotal: order.subtotal,
      deliveryFee: order.delivery_fee,
      total: order.total,
      notes: order.notes,
      businessName: tenant?.name,
      businessEmail: tenant?.business_email,
      businessPhone: tenant?.business_phone,
    }

    // Generate email
    const { html, text } = getCustomerConfirmationEmail(emailData)

    // Send email (redirect to test email if configured)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Moto Kitchen <onboarding@resend.dev>'
    const recipientEmail = getEmailRecipient(order.customer_email)
    
    if (!recipientEmail) {
      return NextResponse.json(
        { message: 'Customer email not available' },
        { status: 400 }
      )
    }
    
    // Add note in subject if using test redirect
    const subjectSuffix = process.env.TEST_EMAIL_REDIRECT 
      ? ` [TEST - Original: ${order.customer_email}]`
      : ''
    
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      replyTo: tenant?.business_email || 'contact@motokitchen.nl',
      subject: `Order Confirmation - ${order.order_number}${subjectSuffix}`,
      html,
      text,
    })

    if (emailError) {
      logger.error('Failed to send confirmation email', { 
        ...context, 
        orderId, 
        error: emailError.message 
      })
      
      // Update email status
      await supabase
        .from('orders')
        .update({ 
          email_status: 'failed',
        })
        .eq('id', orderId)

      return NextResponse.json(
        { message: 'Failed to send email', error: emailError.message },
        { status: 500 }
      )
    }

    // Update email status
    await supabase
      .from('orders')
      .update({ 
        email_sent_at: new Date().toISOString(),
        email_status: 'sent',
      })
      .eq('id', orderId)

    logger.info('Confirmation email sent successfully', { 
      ...context, 
      orderId, 
      emailId: emailResult?.id 
    })

    return NextResponse.json({ 
      success: true, 
      emailId: emailResult?.id 
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin authentication required') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }
    logger.api.error('POST', `/api/orders/${params.id}/send-confirmation`, error, context)
    captureException(error, context)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

