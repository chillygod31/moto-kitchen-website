import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { getCustomerConfirmationEmail, getAdminAlertEmail, getEmailRecipient } from '@/lib/email-templates'
import { logger } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'
import { headers } from 'next/headers'

const resend = new Resend(process.env.RESEND_API_KEY)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

/**
 * POST /api/payments/webhook
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    if (!webhookSecret) {
      logger.error('Stripe webhook secret not configured')
      return NextResponse.json(
        { message: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { message: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      logger.error('Webhook signature verification failed', { error: err.message })
      return NextResponse.json(
        { message: `Webhook Error: ${err.message}` },
        { status: 400 }
      )
    }

    // Log webhook event to database
    const supabase = createServerAdminClient()
    const { data: webhookEvent, error: logError } = await supabase
      .from('webhook_events')
      .insert({
        event_type: event.type,
        stripe_event_id: event.id,
        payload: event as any,
        processed: false,
      })
      .select()
      .single()

    if (logError) {
      logger.error('Failed to log webhook event', { error: logError.message, eventId: event.id })
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Check if order already exists (idempotency)
        const { data: existingPayment } = await supabase
          .from('payments')
          .select('order_id')
          .eq('stripe_session_id', session.id)
          .single()

        if (existingPayment) {
          logger.info('Order already exists for session', { sessionId: session.id })
          // Mark webhook as processed
          if (webhookEvent) {
            await supabase
              .from('webhook_events')
              .update({ processed: true })
              .eq('id', webhookEvent.id)
          }
          return NextResponse.json({ received: true, message: 'Order already exists' })
        }

        // Create order from session metadata
        const metadata = session.metadata || {}
        const tenantId = metadata.tenant_id
        if (!tenantId) {
          logger.error('Missing tenant_id in session metadata', { sessionId: session.id })
          if (webhookEvent) {
            await supabase
              .from('webhook_events')
              .update({ 
                processed: true,
                error_message: 'Missing tenant_id in metadata'
              })
              .eq('id', webhookEvent.id)
          }
          return NextResponse.json({ received: true, message: 'Missing tenant_id' })
        }

        // Generate order number
        const { data: lastOrder } = await supabase
          .from('orders')
          .select('order_number')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        let orderNumber = '1'
        if (lastOrder?.order_number) {
          const lastNum = parseInt(lastOrder.order_number) || 0
          orderNumber = (lastNum + 1).toString()
        }

        // Parse cart items from compact format: "id1:qty1,id2:qty2,..."
        const cartItemsData = (metadata.cart_items || '').split(',').filter(Boolean).map((item: string) => {
          const [id, quantity] = item.split(':')
          return { id, quantity: parseInt(quantity) || 1 }
        })
        
        // Fetch full menu item details from database
        const menuItemIds = cartItemsData.map((item: any) => item.id)
        const { data: menuItems, error: menuError } = await supabase
          .from('menu_items')
          .select('id, name, price')
          .eq('tenant_id', tenantId)
          .in('id', menuItemIds)

        if (menuError) {
          logger.error('Failed to fetch menu items for order', { 
            error: menuError.message, 
            sessionId: session.id 
          })
          if (webhookEvent) {
            await supabase
              .from('webhook_events')
              .update({ 
                processed: true,
                error_message: `Failed to fetch menu items: ${menuError.message}`
              })
              .eq('id', webhookEvent.id)
          }
          return NextResponse.json({ received: true, message: 'Failed to fetch menu items' })
        }

        // Map cart items with full menu item details
        const cartItems = cartItemsData.map((cartItem: any) => {
          const menuItem = menuItems?.find((m: any) => m.id === cartItem.id)
          if (!menuItem) {
            logger.warn('Menu item not found', { itemId: cartItem.id, sessionId: session.id })
          }
          return {
            id: cartItem.id,
            name: menuItem?.name || 'Unknown Item',
            price: menuItem?.price || 0,
            quantity: cartItem.quantity,
          }
        })

        const subtotal = parseFloat(metadata.subtotal || '0')
        const deliveryFee = parseFloat(metadata.delivery_fee || '0')
        const serviceFee = parseFloat(metadata.service_fee || '0')
        const adminFee = parseFloat(metadata.admin_fee || '0')
        const total = parseFloat(metadata.total || '0')

        // Create order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            tenant_id: tenantId,
            order_number: orderNumber,
            customer_name: metadata.customer_name,
            customer_email: metadata.customer_email || null,
            customer_phone: metadata.customer_phone,
            fulfillment_type: metadata.fulfillment_type || 'pickup',
            scheduled_for: metadata.scheduled_for || null,
            delivery_address: metadata.delivery_address || null,
            postcode: metadata.postcode || null,
            city: metadata.city || null,
            subtotal,
            delivery_fee: deliveryFee,
            service_fee: serviceFee,
            admin_fee: adminFee,
            total,
            status: 'new',
            payment_status: 'paid',
            notes: metadata.notes || null,
          })
          .select()
          .single()

        if (orderError) {
          logger.error('Failed to create order from webhook', { 
            error: orderError.message, 
            sessionId: session.id 
          })
          if (webhookEvent) {
            await supabase
              .from('webhook_events')
              .update({ 
                processed: true,
                error_message: orderError.message
              })
              .eq('id', webhookEvent.id)
          }
          return NextResponse.json({ received: true, message: 'Failed to create order' })
        }

        // Create order items
        if (order && cartItems.length > 0) {
          const orderItems = cartItems.map((item: any) => ({
            order_id: order.id,
            menu_item_id: item.id,
            name_snapshot: item.name,
            unit_price: item.price,
            quantity: item.quantity,
            line_total: item.price * item.quantity,
            notes: null, // Notes not stored in compact format
          }))

          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems)

          if (itemsError) {
            logger.error('Failed to create order items', { 
              error: itemsError.message, 
              orderId: order.id 
            })
          }
        }

        // Create payment record
        if (order) {
          await supabase
            .from('payments')
            .insert({
              order_id: order.id,
              provider: 'stripe',
              provider_reference: session.id,
              amount: total,
              status: 'completed',
              stripe_session_id: session.id,
              stripe_payment_intent_id: session.payment_intent as string || null,
              stripe_customer_id: session.customer as string || null,
            })

          // Send emails (async, don't block webhook)
          try {
            // Get order with items for email
            const { data: orderWithItems } = await supabase
              .from('orders')
              .select(`
                *,
                order_items (*)
              `)
              .eq('id', order.id)
              .single()

            // Get tenant and business settings
            const { data: tenant } = await supabase
              .from('tenants')
              .select('name, business_email, business_phone, owner_email')
              .eq('id', tenantId)
              .single()

            const { data: businessSettings } = await supabase
              .from('tenant_business_settings')
              .select('pickup_address, pickup_instructions')
              .eq('tenant_id', tenantId)
              .single()

            if (orderWithItems) {
              const emailData = {
                orderNumber: orderWithItems.order_number,
                customerName: orderWithItems.customer_name,
                customerEmail: orderWithItems.customer_email || '',
                customerPhone: orderWithItems.customer_phone,
                fulfillmentType: orderWithItems.fulfillment_type as 'pickup' | 'delivery',
                scheduledFor: orderWithItems.scheduled_for,
                deliveryAddress: orderWithItems.delivery_address,
                postcode: orderWithItems.postcode,
                city: orderWithItems.city,
                pickupAddress: businessSettings?.pickup_address || null,
                pickupInstructions: businessSettings?.pickup_instructions || null,
                items: (orderWithItems.order_items || []).map((item: any) => ({
                  name: item.name_snapshot,
                  quantity: item.quantity,
                  price: item.unit_price,
                  lineTotal: item.line_total,
                })),
                subtotal: orderWithItems.subtotal,
                deliveryFee: orderWithItems.delivery_fee,
                total: orderWithItems.total,
                notes: orderWithItems.notes,
                businessName: tenant?.name,
                businessEmail: tenant?.business_email,
                businessPhone: tenant?.business_phone,
              }

              // Send customer confirmation email
              if (orderWithItems.customer_email) {
                const { html: customerHtml, text: customerText } = getCustomerConfirmationEmail(emailData)
                const fromEmail = process.env.RESEND_FROM_EMAIL || 'Moto Kitchen <onboarding@resend.dev>'
                const recipientEmail = getEmailRecipient(orderWithItems.customer_email)
                
                if (recipientEmail) {
                  // Add note in subject if using test redirect
                  const subjectSuffix = process.env.TEST_EMAIL_REDIRECT 
                    ? ` [TEST - Original: ${orderWithItems.customer_email}]`
                    : ''
                  
                  try {
                    const { error } = await resend.emails.send({
                      from: fromEmail,
                      to: recipientEmail,
                      replyTo: tenant?.business_email || 'contact@motokitchen.nl',
                      subject: `Order Confirmation - ${orderWithItems.order_number}${subjectSuffix}`,
                      html: customerHtml,
                      text: customerText,
                    })

                    if (error) {
                      logger.error('Failed to send customer confirmation email', { orderId: order.id, error: error.message })
                      await supabase
                        .from('orders')
                        .update({ 
                          email_status: 'failed',
                        })
                        .eq('id', order.id)
                    } else {
                      await supabase
                        .from('orders')
                        .update({ 
                          email_sent_at: new Date().toISOString(),
                          email_status: 'sent',
                        })
                        .eq('id', order.id)
                    }
                  } catch (err: any) {
                    logger.error('Error sending customer email', { orderId: order.id, error: err.message })
                    await supabase
                      .from('orders')
                      .update({ 
                        email_status: 'failed',
                      })
                      .eq('id', order.id)
                  }
                } else {
                  // No resolvable recipient (missing email or redirect), mark as failed
                  await supabase
                    .from('orders')
                    .update({ 
                      email_status: 'failed',
                    })
                    .eq('id', order.id)
                }
              } else {
                // Missing customer email entirely
                await supabase
                  .from('orders')
                  .update({ 
                    email_status: 'failed',
                  })
                  .eq('id', order.id)
              }

              // Send admin alert email
              const adminEmail = tenant?.business_email || tenant?.owner_email
              if (adminEmail) {
                const { html: adminHtml, text: adminText } = getAdminAlertEmail(emailData)
                const fromEmail = process.env.RESEND_FROM_EMAIL || 'Moto Kitchen <onboarding@resend.dev>'
                const recipientEmail = getEmailRecipient(adminEmail)
                
                if (recipientEmail) {
                  // Add note in subject if using test redirect
                  const subjectSuffix = process.env.TEST_EMAIL_REDIRECT 
                    ? ` [TEST - Original: ${adminEmail}]`
                    : ''
                  
                  resend.emails.send({
                    from: fromEmail,
                    to: recipientEmail,
                    replyTo: orderWithItems.customer_email || undefined,
                    subject: `🆕 New Order: ${orderWithItems.order_number}${subjectSuffix}`,
                    html: adminHtml,
                    text: adminText,
                  }).catch(err => {
                    logger.error('Error sending admin alert email', { orderId: order.id, error: err.message })
                  })
                }
              }
            }
          } catch (emailError: any) {
            // Don't fail webhook if email fails
            logger.error('Error sending order emails', { orderId: order.id, error: emailError.message })
          }
        }

        // Mark webhook as processed
        if (webhookEvent) {
          await supabase
            .from('webhook_events')
            .update({ processed: true })
            .eq('id', webhookEvent.id)
        }

        logger.info('Order created from Stripe webhook', { 
          orderId: order?.id, 
          sessionId: session.id,
          tenantId 
        })

        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Update payment status if order exists
        const { data: payment } = await supabase
          .from('payments')
          .select('order_id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single()

        if (payment) {
          await supabase
            .from('orders')
            .update({ payment_status: 'paid' })
            .eq('id', payment.order_id)

          await supabase
            .from('payments')
            .update({ status: 'completed' })
            .eq('stripe_payment_intent_id', paymentIntent.id)
        }

        if (webhookEvent) {
          await supabase
            .from('webhook_events')
            .update({ processed: true })
            .eq('id', webhookEvent.id)
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Update payment status
        const { data: payment } = await supabase
          .from('payments')
          .select('order_id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single()

        if (payment) {
          await supabase
            .from('orders')
            .update({ payment_status: 'unpaid' })
            .eq('id', payment.order_id)

          await supabase
            .from('payments')
            .update({ status: 'failed' })
            .eq('stripe_payment_intent_id', paymentIntent.id)
        }

        if (webhookEvent) {
          await supabase
            .from('webhook_events')
            .update({ processed: true })
            .eq('id', webhookEvent.id)
        }

        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        
        // Update payment and order status
        const { data: payment } = await supabase
          .from('payments')
          .select('order_id')
          .eq('stripe_payment_intent_id', charge.payment_intent as string)
          .single()

        if (payment) {
          await supabase
            .from('orders')
            .update({ payment_status: 'refunded' })
            .eq('id', payment.order_id)

          await supabase
            .from('payments')
            .update({ status: 'refunded' })
            .eq('stripe_payment_intent_id', charge.payment_intent as string)
        }

        if (webhookEvent) {
          await supabase
            .from('webhook_events')
            .update({ processed: true })
            .eq('id', webhookEvent.id)
        }

        break
      }

      default:
        logger.info('Unhandled webhook event type', { type: event.type })
        if (webhookEvent) {
          await supabase
            .from('webhook_events')
            .update({ processed: true })
            .eq('id', webhookEvent.id)
        }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    logger.error('Webhook handler error', { error: error.message })
    captureException(error, {})
    return NextResponse.json(
      { message: 'Webhook handler error', error: error.message },
      { status: 500 }
    )
  }
}
