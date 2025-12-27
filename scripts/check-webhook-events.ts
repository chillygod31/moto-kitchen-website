/**
 * Check Webhook Events Script
 * 
 * Diagnoses why orders aren't appearing after Stripe checkout
 * 
 * Usage: tsx scripts/check-webhook-events.ts
 */

import dotenv from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
const envPath = resolve(process.cwd(), '.env.local')
dotenv.config({ path: envPath })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

async function checkWebhookEvents() {
  console.log('🔍 Checking webhook events and orders...\n')

  // Get recent webhook events
  const { data: webhookEvents, error: webhookError } = await supabase
    .from('webhook_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (webhookError) {
    console.error('❌ Error fetching webhook events:', webhookError.message)
    return
  }

  console.log(`📦 Found ${webhookEvents?.length || 0} recent webhook events:\n`)

  if (!webhookEvents || webhookEvents.length === 0) {
    console.log('⚠️  No webhook events found. This means:')
    console.log('   1. Webhooks are not being received (check Stripe webhook configuration)')
    console.log('   2. Webhook secret might be wrong')
    console.log('   3. Webhook endpoint might not be accessible\n')
    return
  }

  webhookEvents.forEach((event, index) => {
    console.log(`${index + 1}. ${event.event_type}`)
    console.log(`   Event ID: ${event.stripe_event_id}`)
    console.log(`   Processed: ${event.processed ? '✅' : '❌'}`)
    if (event.error_message) {
      console.log(`   Error: ${event.error_message}`)
    }
    console.log(`   Created: ${new Date(event.created_at).toLocaleString()}\n`)
  })

  // Get recent orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (ordersError) {
    console.error('❌ Error fetching orders:', ordersError.message)
    return
  }

  console.log(`\n📋 Found ${orders?.length || 0} recent orders:\n`)

  if (!orders || orders.length === 0) {
    console.log('⚠️  No orders found in database.\n')
    return
  }

  orders.forEach((order, index) => {
    console.log(`${index + 1}. Order #${order.order_number}`)
    console.log(`   Customer: ${order.customer_name}`)
    console.log(`   Status: ${order.status}`)
    console.log(`   Payment Status: ${order.payment_status}`)
    console.log(`   Total: €${order.total}`)
    console.log(`   Created: ${new Date(order.created_at).toLocaleString()}\n`)
  })

  // Check for unprocessed webhooks
  const unprocessed = webhookEvents.filter(e => !e.processed)
  if (unprocessed.length > 0) {
    console.log(`\n⚠️  Found ${unprocessed.length} unprocessed webhook events:`)
    unprocessed.forEach(event => {
      console.log(`   - ${event.event_type} (${event.stripe_event_id})`)
      if (event.error_message) {
        console.log(`     Error: ${event.error_message}`)
      }
    })
    console.log('\n💡 These events failed to process. Check the error messages above.')
  }

  // Check payments
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*, orders(order_number)')
    .order('created_at', { ascending: false })
    .limit(10)

  if (!paymentsError && payments) {
    console.log(`\n💳 Found ${payments.length} recent payments:`)
    payments.forEach((payment, index) => {
      const order = payment.orders as any
      console.log(`${index + 1}. Payment for Order #${order?.order_number || 'N/A'}`)
      console.log(`   Status: ${payment.status}`)
      console.log(`   Amount: €${payment.amount}`)
      console.log(`   Stripe Session: ${payment.stripe_session_id?.substring(0, 20)}...`)
    })
  }
}

checkWebhookEvents()
  .then(() => {
    console.log('\n✅ Diagnostic complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error.message)
    process.exit(1)
  })

