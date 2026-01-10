/**
 * Double Booking Prevention Tests
 *
 * These tests verify that the atomic RPC function + CHECK constraint
 * prevent slot overbooking even under concurrent load.
 *
 * Critical: These tests MUST pass before going to production.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

describe('Double Booking Prevention', () => {
  let supabase: ReturnType<typeof createClient>
  let testTenantId: string
  let testSlotId: string

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get or create test tenant
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
    // Create a test time slot with max_orders = 2
    const { data: slot, error } = await supabase
      .from('time_slots')
      .insert({
        tenant_id: testTenantId,
        slot_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        max_orders: 2,
        current_orders: 0,
        is_active: true,
        fulfillment_type: 'pickup'
      })
      .select('id')
      .single()

    if (error || !slot) {
      throw new Error(`Failed to create test slot: ${error?.message}`)
    }

    testSlotId = slot.id
  })

  afterEach(async () => {
    // Cleanup: Delete test slot and orders
    if (testSlotId) {
      await supabase.from('order_items').delete().match({ tenant_id: testTenantId })
      await supabase.from('orders').delete().match({ time_slot_id: testSlotId })
      await supabase.from('time_slots').delete().match({ id: testSlotId })
    }
  })

  test('should allow booking up to max_orders', async () => {
    // Book first order
    const result1 = await supabase.rpc('create_pending_order_with_slot', {
      p_tenant_id: testTenantId,
      p_session_id: 'test_session_1',
      p_slot_id: testSlotId,
      p_order_data: {
        customer_name: 'Test Customer 1',
        customer_email: 'test1@example.com',
        customer_phone: '+31612345678',
        fulfillment_type: 'pickup',
        scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        subtotal: 50.00,
        delivery_fee: 0,
        service_fee: 1.50,
        admin_fee: 0.50,
        total: 52.00,
        cart_items: [
          {
            menu_item_id: '00000000-0000-0000-0000-000000000001',
            name: 'Test Item',
            price: 50.00,
            quantity: 1
          }
        ]
      }
    })

    expect(result1.error).toBeNull()
    expect(result1.data).toHaveLength(1)
    expect(result1.data[0].slot_booked).toBe(true)

    // Book second order (should succeed - at capacity)
    const result2 = await supabase.rpc('create_pending_order_with_slot', {
      p_tenant_id: testTenantId,
      p_session_id: 'test_session_2',
      p_slot_id: testSlotId,
      p_order_data: {
        customer_name: 'Test Customer 2',
        customer_email: 'test2@example.com',
        customer_phone: '+31612345679',
        fulfillment_type: 'pickup',
        scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        subtotal: 50.00,
        delivery_fee: 0,
        service_fee: 1.50,
        admin_fee: 0.50,
        total: 52.00,
        cart_items: []
      }
    })

    expect(result2.error).toBeNull()
    expect(result2.data[0].slot_booked).toBe(true)

    // Verify slot is now full
    const { data: slot } = await supabase
      .from('time_slots')
      .select('current_orders, max_orders')
      .eq('id', testSlotId)
      .single()

    expect(slot?.current_orders).toBe(2)
    expect(slot?.max_orders).toBe(2)
  })

  test('should reject booking when slot is full', async () => {
    // Fill the slot (max_orders = 2)
    await supabase.rpc('create_pending_order_with_slot', {
      p_tenant_id: testTenantId,
      p_session_id: 'test_session_1',
      p_slot_id: testSlotId,
      p_order_data: {
        customer_name: 'Test Customer 1',
        customer_phone: '+31612345678',
        fulfillment_type: 'pickup',
        subtotal: 50.00,
        total: 52.00,
        cart_items: []
      }
    })

    await supabase.rpc('create_pending_order_with_slot', {
      p_tenant_id: testTenantId,
      p_session_id: 'test_session_2',
      p_slot_id: testSlotId,
      p_order_data: {
        customer_name: 'Test Customer 2',
        customer_phone: '+31612345679',
        fulfillment_type: 'pickup',
        subtotal: 50.00,
        total: 52.00,
        cart_items: []
      }
    })

    // Attempt third booking (should fail)
    const result3 = await supabase.rpc('create_pending_order_with_slot', {
      p_tenant_id: testTenantId,
      p_session_id: 'test_session_3',
      p_slot_id: testSlotId,
      p_order_data: {
        customer_name: 'Test Customer 3',
        customer_phone: '+31612345680',
        fulfillment_type: 'pickup',
        subtotal: 50.00,
        total: 52.00,
        cart_items: []
      }
    })

    // Should fail with slot full error
    expect(result3.error).toBeTruthy()
    expect(result3.error?.message).toContain('Slot')
    expect(result3.error?.message).toContain('full')

    // Verify current_orders didn't increment
    const { data: slot } = await supabase
      .from('time_slots')
      .select('current_orders')
      .eq('id', testSlotId)
      .single()

    expect(slot?.current_orders).toBe(2) // Still 2, not 3
  })

  test('should handle concurrent bookings correctly', async () => {
    // Simulate 5 concurrent requests for a slot with max_orders = 2
    // Only 2 should succeed, 3 should fail

    const bookingPromises = Array.from({ length: 5 }, (_, i) =>
      supabase.rpc('create_pending_order_with_slot', {
        p_tenant_id: testTenantId,
        p_session_id: `concurrent_session_${i}`,
        p_slot_id: testSlotId,
        p_order_data: {
          customer_name: `Concurrent Customer ${i}`,
          customer_phone: `+3161234567${i}`,
          fulfillment_type: 'pickup',
          subtotal: 50.00,
          total: 52.00,
          cart_items: []
        }
      })
    )

    const results = await Promise.all(bookingPromises)

    const successes = results.filter(r => !r.error)
    const failures = results.filter(r => r.error)

    // Exactly 2 should succeed
    expect(successes).toHaveLength(2)
    expect(failures).toHaveLength(3)

    // Verify slot capacity
    const { data: slot } = await supabase
      .from('time_slots')
      .select('current_orders')
      .eq('id', testSlotId)
      .single()

    expect(slot?.current_orders).toBe(2)
  })

  test('should enforce CHECK constraint as safety net', async () => {
    // This test verifies the database-level CHECK constraint
    // Try to manually violate the constraint (should fail)

    // First, fill the slot normally
    await supabase.rpc('create_pending_order_with_slot', {
      p_tenant_id: testTenantId,
      p_session_id: 'test_session_1',
      p_slot_id: testSlotId,
      p_order_data: {
        customer_name: 'Test Customer',
        customer_phone: '+31612345678',
        fulfillment_type: 'pickup',
        subtotal: 50.00,
        total: 52.00,
        cart_items: []
      }
    })

    await supabase.rpc('create_pending_order_with_slot', {
      p_tenant_id: testTenantId,
      p_session_id: 'test_session_2',
      p_slot_id: testSlotId,
      p_order_data: {
        customer_name: 'Test Customer 2',
        customer_phone: '+31612345679',
        fulfillment_type: 'pickup',
        subtotal: 50.00,
        total: 52.00,
        cart_items: []
      }
    })

    // Now try to bypass the RPC and increment directly (should be blocked by CHECK constraint)
    const { error } = await supabase
      .from('time_slots')
      .update({ current_orders: 3 }) // Try to set above max_orders (2)
      .eq('id', testSlotId)

    // Should fail due to CHECK constraint
    expect(error).toBeTruthy()
    expect(error?.message).toMatch(/check_slot_capacity|violates check constraint/)
  })

  test('should release slot on order cancellation', async () => {
    // Book a slot
    const { data: orderData } = await supabase.rpc('create_pending_order_with_slot', {
      p_tenant_id: testTenantId,
      p_session_id: 'test_session_cancel',
      p_slot_id: testSlotId,
      p_order_data: {
        customer_name: 'Test Customer',
        customer_phone: '+31612345678',
        fulfillment_type: 'pickup',
        subtotal: 50.00,
        total: 52.00,
        cart_items: []
      }
    })

    expect(orderData).toHaveLength(1)

    // Verify slot was booked
    const { data: slotBefore } = await supabase
      .from('time_slots')
      .select('current_orders')
      .eq('id', testSlotId)
      .single()

    expect(slotBefore?.current_orders).toBe(1)

    // Release the slot
    const { error } = await supabase.rpc('release_time_slot', {
      p_slot_id: testSlotId,
      p_tenant_id: testTenantId
    })

    expect(error).toBeNull()

    // Verify slot was released
    const { data: slotAfter } = await supabase
      .from('time_slots')
      .select('current_orders')
      .eq('id', testSlotId)
      .single()

    expect(slotAfter?.current_orders).toBe(0)
  })
})
