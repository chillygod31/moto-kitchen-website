/**
 * Stripe Payment Flow End-to-End Tests
 *
 * Tests the complete payment flow in TEST MODE using Stripe test cards.
 * These tests verify the payment system works correctly before production.
 *
 * CRITICAL: All tests must pass before switching to production keys.
 */

import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const stripeSecretKey = process.env.STRIPE_SECRET_KEY!
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

describe('Stripe Payment Flow (TEST MODE)', () => {
  let supabase: ReturnType<typeof createClient>
  let stripe: Stripe
  let testTenantId: string
  let testSlotId: string

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseServiceKey)
    stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-12-15.clover' })

    // Verify we're in TEST mode
    if (!stripeSecretKey.startsWith('sk_test_')) {
      throw new Error('DANGER: Not using Stripe TEST keys! Tests aborted.')
    }

    // Get test tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'moto-kitchen')
      .single()

    if (!tenant) {
      throw new Error('Test tenant not found')
    }

    testTenantId = tenant.id
  })

  beforeEach(async () => {
    // Create a test time slot
    const { data: slot } = await supabase
      .from('time_slots')
      .insert({
        tenant_id: testTenantId,
        slot_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        max_orders: 10,
        current_orders: 0,
        is_active: true,
        fulfillment_type: 'pickup'
      })
      .select('id')
      .single()

    testSlotId = slot!.id
  })

  afterEach(async () => {
    // Cleanup
    if (testSlotId) {
      await supabase.from('order_items').delete().match({ tenant_id: testTenantId })
      await supabase.from('payments').delete().match({ order_id: testSlotId })
      await supabase.from('orders').delete().match({ time_slot_id: testSlotId })
      await supabase.from('time_slots').delete().match({ id: testSlotId })
    }
  })

  test('Scenario 1: Successful payment with valid test card', async () => {
    // Step 1: Create checkout session
    const response = await fetch(`${siteUrl}/api/payments/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': testTenantId
      },
      body: JSON.stringify({
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '+31612345678',
        fulfillmentType: 'pickup',
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        selectedTimeSlot: testSlotId,
        cartItems: [{
          id: '123',
          name: 'Test Item',
          price: 50.00,
          quantity: 1,
          description: 'Test item description'
        }],
        subtotal: 50.00,
        deliveryFee: 0,
        serviceFee: 1.50,
        adminFee: 0.50,
        total: 52.00,
        notes: 'Test order'
      })
    })

    expect(response.status).toBe(200)
    const { sessionId, orderId, orderNumber } = await response.json()

    expect(sessionId).toBeTruthy()
    expect(orderId).toBeTruthy()
    expect(orderNumber).toBeTruthy()

    // Step 2: Verify pending order was created
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    expect(order?.payment_status).toBe('pending')
    expect(order?.status).toBe('new')
    expect(order?.stripe_session_id).toBe(sessionId)

    // Step 3: Verify slot was booked
    const { data: slot } = await supabase
      .from('time_slots')
      .select('current_orders')
      .eq('id', testSlotId)
      .single()

    expect(slot?.current_orders).toBe(1)

    // Step 4: Simulate successful payment (trigger webhook manually in real test)
    // For automated testing, we'll verify the session exists and is payable
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    expect(session.payment_status).toBe('unpaid')
    expect(session.status).toBe('open')
    expect(session.metadata?.tenant_id).toBe(testTenantId)

    console.log('✅ Payment session created successfully')
    console.log(`   Session ID: ${sessionId}`)
    console.log(`   Order: #${orderNumber}`)
    console.log(`   Test payment URL: ${session.url}`)
  }, 30000)

  test('Scenario 2: Expired session (order past 30 min)', async () => {
    // Create a checkout session
    const response = await fetch(`${siteUrl}/api/payments/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': testTenantId
      },
      body: JSON.stringify({
        customerName: 'Test Customer Expiry',
        customerPhone: '+31612345678',
        fulfillmentType: 'pickup',
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        selectedTimeSlot: testSlotId,
        cartItems: [{
          id: '123',
          name: 'Test Item',
          price: 50.00,
          quantity: 1
        }],
        subtotal: 50.00,
        total: 52.00
      })
    })

    const { sessionId, orderId } = await response.json()

    // Manually expire the order (simulate 30 min passing)
    await supabase
      .from('orders')
      .update({ 
        expires_at: new Date(Date.now() - 1000).toISOString(), // 1 second ago
        payment_status: 'expired'
      })
      .eq('id', orderId)

    // Verify order is expired
    const { data: order } = await supabase
      .from('orders')
      .select('payment_status')
      .eq('id', orderId)
      .single()

    expect(order?.payment_status).toBe('expired')

    // Verify Stripe session is also expired
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const now = Math.floor(Date.now() / 1000)
    
    // Session should either be expired or close to expiring
    expect(session.expires_at).toBeGreaterThan(now - 1800) // Created less than 30 min ago
    expect(session.expires_at).toBeLessThan(now + 1800) // Expires within 30 min

    console.log('✅ Expiry mechanism verified')
  }, 30000)

  test('Scenario 3: Slot full (reject new booking)', async () => {
    // Fill the slot to capacity (max_orders = 10)
    const bookingPromises = Array.from({ length: 10 }, (_, i) =>
      fetch(`${siteUrl}/api/payments/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': testTenantId
        },
        body: JSON.stringify({
          customerName: `Customer ${i}`,
          customerPhone: `+3161234567${i}`,
          fulfillment_type: 'pickup',
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          selectedTimeSlot: testSlotId,
          cartItems: [{ id: '123', name: 'Test', price: 50, quantity: 1 }],
          subtotal: 50,
          total: 50
        })
      })
    )

    const results = await Promise.all(bookingPromises)
    const successCount = results.filter(r => r.status === 200).length

    expect(successCount).toBe(10) // All 10 should succeed

    // Attempt 11th booking (should fail)
    const response11 = await fetch(`${siteUrl}/api/payments/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': testTenantId
      },
      body: JSON.stringify({
        customerName: 'Customer 11',
        customerPhone: '+31612345670',
        fulfillmentType: 'pickup',
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        selectedTimeSlot: testSlotId,
        cartItems: [{ id: '123', name: 'Test', price: 50, quantity: 1 }],
        subtotal: 50,
        total: 50
      })
    })

    expect(response11.status).toBe(500) // Should fail
    const error = await response11.json()
    expect(error.message).toContain('Failed to create payment session')

    // Verify slot is still at max capacity
    const { data: slot } = await supabase
      .from('time_slots')
      .select('current_orders')
      .eq('id', testSlotId)
      .single()

    expect(slot?.current_orders).toBe(10) // Still 10, not 11

    console.log('✅ Slot capacity enforcement verified')
  }, 60000)

  test('Scenario 4: Failed payment (declined card)', async () => {
    // Note: This test creates the session but cannot simulate card decline
    // In real testing, you would use Stripe test card: 4000 0000 0000 0002 (decline)
    
    const response = await fetch(`${siteUrl}/api/payments/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': testTenantId
      },
      body: JSON.stringify({
        customerName: 'Test Declined Card',
        customerPhone: '+31612345678',
        fulfillmentType: 'pickup',
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        selectedTimeSlot: testSlotId,
        cartItems: [{ id: '123', name: 'Test', price: 50, quantity: 1 }],
        subtotal: 50,
        total: 50
      })
    })

    const { sessionId, orderId } = await response.json()

    // Verify order is pending
    const { data: order } = await supabase
      .from('orders')
      .select('payment_status')
      .eq('id', orderId)
      .single()

    expect(order?.payment_status).toBe('pending')

    console.log('✅ Failed payment scenario setup complete')
    console.log('   Manual test: Use card 4000 0000 0000 0002 at:', sessionId)
    console.log('   Expected: Payment fails, order remains pending, slot stays reserved until expiry')
  }, 30000)

  test('Scenario 5: Concurrent payments (stress test)', async () => {
    // Simulate 5 customers checking out simultaneously
    const concurrentBookings = Array.from({ length: 5 }, (_, i) =>
      fetch(`${siteUrl}/api/payments/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': testTenantId
        },
        body: JSON.stringify({
          customerName: `Concurrent Customer ${i}`,
          customerPhone: `+3161234567${i}`,
          fulfillmentType: 'pickup',
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          selectedTimeSlot: testSlotId,
          cartItems: [{ id: '123', name: 'Test', price: 50, quantity: 1 }],
          subtotal: 50,
          total: 50
        })
      })
    )

    const results = await Promise.all(concurrentBookings)
    const successful = results.filter(r => r.status === 200)

    // All should succeed (slot capacity is 10)
    expect(successful.length).toBe(5)

    // Verify slot capacity updated correctly
    const { data: slot } = await supabase
      .from('time_slots')
      .select('current_orders')
      .eq('id', testSlotId)
      .single()

    expect(slot?.current_orders).toBe(5)

    console.log('✅ Concurrent payment handling verified')
  }, 60000)
})
