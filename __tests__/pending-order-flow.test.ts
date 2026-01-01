/**
 * P0 Payment Safety Tests - Pending Order Flow
 * 
 * Tests the pending order lifecycle, including creation,
 * expiry, cleanup, and success page polling.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { createServerAdminClient } from '@/lib/supabase/server-admin';

describe('P0 Payment System - Pending Order Flow', () => {
  let supabase: any;
  const TEST_TENANT_ID = process.env.TEST_TENANT_ID || '00000000-0000-0000-0000-000000000001';
  
  beforeEach(async () => {
    supabase = createServerAdminClient();
    // Clean test data
    await supabase.from('email_queue').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('time_slots').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });
  
  test('Create pending order with slot booking (atomic)', async () => {
    const sessionId = `sess_test_pending_${Date.now()}`;
    const slotTime = new Date(Date.now() + 86400000);
    
    // Create a slot
    const { data: slot } = await supabase
      .from('time_slots')
      .insert({
        tenant_id: TEST_TENANT_ID,
        slot_time: slotTime.toISOString(),
        fulfillment_type: 'pickup',
        max_orders: 5,
        current_orders: 0,
        is_active: true
      })
      .select()
      .single();
    
    // Create pending order with slot
    const { data: result, error } = await supabase.rpc('create_pending_order_with_slot', {
      p_tenant_id: TEST_TENANT_ID,
      p_session_id: sessionId,
      p_slot_id: slot.id,
      p_order_data: {
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '+31612345678',
        fulfillment_type: 'pickup',
        scheduled_for: slotTime.toISOString(),
        delivery_address: '',
        postcode: '',
        city: '',
        subtotal: '30.00',
        delivery_fee: '0.00',
        service_fee: '0.00',
        admin_fee: '0.00',
        total: '30.00',
        notes: 'Test order',
        cart_items: [
          { menu_item_id: '00000000-0000-0000-0000-000000000001', name: 'Test Item 1', price: '15.00', quantity: 2 }
        ]
      }
    });
    
    expect(error).toBeNull();
    expect(result).toBeTruthy();
    expect(result[0].order_id).toBeTruthy();
    expect(result[0].order_number).toBeTruthy();
    expect(result[0].slot_booked).toBe(true);
    
    // Verify order was created
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', result[0].order_id)
      .single();
    
    expect(order.payment_status).toBe('pending');
    expect(order.stripe_session_id).toBe(sessionId);
    expect(order.expires_at).toBeTruthy();
    expect(order.time_slot_id).toBe(slot.id);
    
    // Verify order items were created
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', result[0].order_id);
    
    expect(items.length).toBe(1);
    expect(items[0].name_snapshot).toBe('Test Item 1');
    expect(items[0].quantity).toBe(2);
    
    // Verify slot counter was incremented
    const { data: updatedSlot } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', slot.id)
      .single();
    
    expect(updatedSlot.current_orders).toBe(1);
  });
  
  test('Create pending order fails if slot is full', async () => {
    const sessionId = `sess_test_full_slot_${Date.now()}`;
    const slotTime = new Date(Date.now() + 86400000);
    
    // Create a full slot
    const { data: slot } = await supabase
      .from('time_slots')
      .insert({
        tenant_id: TEST_TENANT_ID,
        slot_time: slotTime.toISOString(),
        fulfillment_type: 'pickup',
        max_orders: 2,
        current_orders: 2,
        is_active: true
      })
      .select()
      .single();
    
    // Try to create pending order
    try {
      await supabase.rpc('create_pending_order_with_slot', {
        p_tenant_id: TEST_TENANT_ID,
        p_session_id: sessionId,
        p_slot_id: slot.id,
        p_order_data: {
          customer_name: 'Test Customer',
          customer_email: 'test@example.com',
          customer_phone: '+31612345678',
          fulfillment_type: 'pickup',
          scheduled_for: slotTime.toISOString(),
          delivery_address: '',
          postcode: '',
          city: '',
          subtotal: '25.00',
          delivery_fee: '0.00',
          service_fee: '0.00',
          admin_fee: '0.00',
          total: '25.00',
          notes: '',
          cart_items: []
        }
      });
      
      expect(true).toBe(false); // Should not reach
    } catch (error: any) {
      expect(error.message).toContain('full');
    }
    
    // Verify slot counter was not incremented
    const { data: updatedSlot } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', slot.id)
      .single();
    
    expect(updatedSlot.current_orders).toBe(2);
  });
  
  test('Pending orders expire and slot counter decrements', async () => {
    const sessionId = `sess_test_expire_${Date.now()}`;
    const slotTime = new Date(Date.now() + 86400000);
    
    // Create a slot
    const { data: slot } = await supabase
      .from('time_slots')
      .insert({
        tenant_id: TEST_TENANT_ID,
        slot_time: slotTime.toISOString(),
        fulfillment_type: 'pickup',
        max_orders: 5,
        current_orders: 0,
        is_active: true
      })
      .select()
      .single();
    
    // Create pending order
    const { data: result } = await supabase.rpc('create_pending_order_with_slot', {
      p_tenant_id: TEST_TENANT_ID,
      p_session_id: sessionId,
      p_slot_id: slot.id,
      p_order_data: {
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '+31612345678',
        fulfillment_type: 'pickup',
        scheduled_for: slotTime.toISOString(),
        delivery_address: '',
        postcode: '',
        city: '',
        subtotal: '25.00',
        delivery_fee: '0.00',
        service_fee: '0.00',
        admin_fee: '0.00',
        total: '25.00',
        notes: '',
        cart_items: []
      }
    });
    
    const orderId = result[0].order_id;
    
    // Verify slot counter was incremented
    const { data: slotBefore } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', slot.id)
      .single();
    
    expect(slotBefore.current_orders).toBe(1);
    
    // Manually expire the order
    await supabase
      .from('orders')
      .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
      .eq('id', orderId);
    
    // Run cleanup
    const { data: cleanupResult } = await supabase.rpc('cleanup_expired_pending_orders');
    
    expect(cleanupResult[0].expired_count).toBeGreaterThanOrEqual(1);
    expect(cleanupResult[0].slot_adjustments).toBeGreaterThanOrEqual(1);
    
    // Check order is expired
    const { data: expiredOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    expect(expiredOrder.payment_status).toBe('expired');
    
    // Check slot counter was decremented
    const { data: slotAfter } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', slot.id)
      .single();
    
    expect(slotAfter.current_orders).toBe(0);
  });
  
  test('Pending order → paid transition queues emails', async () => {
    const sessionId = `sess_test_paid_${Date.now()}`;
    const eventId = `evt_test_paid_${Date.now()}`;
    
    // Create pending order (no slot)
    const { data: result } = await supabase.rpc('create_pending_order_with_slot', {
      p_tenant_id: TEST_TENANT_ID,
      p_session_id: sessionId,
      p_slot_id: null,
      p_order_data: {
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '+31612345678',
        fulfillment_type: 'pickup',
        scheduled_for: new Date(Date.now() + 86400000).toISOString(),
        delivery_address: '',
        postcode: '',
        city: '',
        subtotal: '25.00',
        delivery_fee: '0.00',
        service_fee: '0.00',
        admin_fee: '0.00',
        total: '25.00',
        notes: '',
        cart_items: [
          { menu_item_id: '00000000-0000-0000-0000-000000000001', name: 'Test Item', price: '25.00', quantity: 1 }
        ]
      }
    });
    
    const orderId = result[0].order_id;
    
    // Process webhook
    await supabase.rpc('process_webhook_atomically', {
      p_event_id: eventId,
      p_session_id: sessionId,
      p_payment_intent: 'pi_test_email',
      p_tenant_id: TEST_TENANT_ID
    });
    
    // Check order is paid
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    expect(order.payment_status).toBe('paid');
    expect(order.email_status).toBe('pending');
    
    // Check emails were queued
    const { data: emails } = await supabase
      .from('email_queue')
      .select('*')
      .eq('order_id', orderId);
    
    // Should have customer confirmation and admin alert
    expect(emails.length).toBeGreaterThanOrEqual(1);
    expect(emails.some((e: any) => e.email_type === 'customer_confirmation')).toBe(true);
  });
  
  test('Verify-session endpoint returns correct status', async () => {
    const sessionId = `sess_test_verify_${Date.now()}`;
    
    // Before order exists
    const { data: notFound } = await supabase
      .from('orders')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();
    
    expect(notFound).toBeNull();
    
    // Create pending order
    await supabase.rpc('create_pending_order_with_slot', {
      p_tenant_id: TEST_TENANT_ID,
      p_session_id: sessionId,
      p_slot_id: null,
      p_order_data: {
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '+31612345678',
        fulfillment_type: 'pickup',
        scheduled_for: new Date(Date.now() + 86400000).toISOString(),
        delivery_address: '',
        postcode: '',
        city: '',
        subtotal: '25.00',
        delivery_fee: '0.00',
        service_fee: '0.00',
        admin_fee: '0.00',
        total: '25.00',
        notes: '',
        cart_items: []
      }
    });
    
    // Check pending status
    const { data: pending } = await supabase
      .from('orders')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();
    
    expect(pending.payment_status).toBe('pending');
    
    // Process webhook
    await supabase.rpc('process_webhook_atomically', {
      p_event_id: `evt_test_verify_${Date.now()}`,
      p_session_id: sessionId,
      p_payment_intent: 'pi_test_verify',
      p_tenant_id: TEST_TENANT_ID
    });
    
    // Check paid status
    const { data: paid } = await supabase
      .from('orders')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();
    
    expect(paid.payment_status).toBe('paid');
  });
});

