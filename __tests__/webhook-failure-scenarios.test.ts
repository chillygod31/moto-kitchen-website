/**
 * P0 Payment Safety Tests - Webhook Failure Scenarios
 * 
 * Tests critical failure scenarios to ensure the payment system
 * handles errors gracefully and prevents data corruption.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { createServerAdminClient } from '@/lib/supabase/server-admin';

// Note: These tests require a test database with the P0 migrations applied
// Run migrations before testing:
// psql -U postgres -d test_db -f supabase/migrations/2025-12-30-01-pending-orders-alerts.sql
// psql -U postgres -d test_db -f supabase/migrations/2025-12-30-02-slot-management-functions.sql
// psql -U postgres -d test_db -f supabase/migrations/2025-12-30-03-atomic-webhook-function.sql
// psql -U postgres -d test_db -f supabase/migrations/2025-12-30-04-cleanup-expired-orders.sql

describe('P0 Payment System - Webhook Failure Scenarios', () => {
  let supabase: any;
  const TEST_TENANT_ID = process.env.TEST_TENANT_ID || '00000000-0000-0000-0000-000000000001';
  
  beforeEach(async () => {
    supabase = createServerAdminClient();
    // Clean test data
    await supabase.from('webhook_alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('email_queue').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('webhook_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });
  
  test('Webhook deduplication - same event processed twice only creates one order', async () => {
    const sessionId = `sess_test_dedup_${Date.now()}`;
    const eventId = `evt_test_dedup_${Date.now()}`;
    
    // Create pending order first
    const { data: pendingOrder } = await supabase.rpc('create_pending_order_with_slot', {
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
    
    expect(pendingOrder).toBeTruthy();
    expect(pendingOrder[0].order_id).toBeTruthy();
    
    // Process first time
    const { data: result1 } = await supabase.rpc('process_webhook_atomically', {
      p_event_id: eventId,
      p_session_id: sessionId,
      p_payment_intent: 'pi_test_123',
      p_tenant_id: TEST_TENANT_ID
    });
    
    expect(result1.status).toBe('success');
    expect(result1.order_id).toBe(pendingOrder[0].order_id);
    
    // Process second time (duplicate)
    const { data: result2 } = await supabase.rpc('process_webhook_atomically', {
      p_event_id: eventId,
      p_session_id: sessionId,
      p_payment_intent: 'pi_test_123',
      p_tenant_id: TEST_TENANT_ID
    });
    
    expect(result2.status).toBe('already_processed');
    
    // Only one order should exist
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('stripe_session_id', sessionId);
    
    expect(orders.length).toBe(1);
    expect(orders[0].payment_status).toBe('paid');
  });
  
  test('Expired order with full slot creates critical alert', async () => {
    const sessionId = `sess_test_expired_full_${Date.now()}`;
    const eventId = `evt_test_expired_full_${Date.now()}`;
    
    // Create a slot
    const slotTime = new Date(Date.now() + 86400000);
    const { data: slot } = await supabase
      .from('time_slots')
      .insert({
        tenant_id: TEST_TENANT_ID,
        slot_time: slotTime.toISOString(),
        fulfillment_type: 'pickup',
        max_orders: 1,
        current_orders: 0,
        is_active: true
      })
      .select()
      .single();
    
    // Create pending order with slot that expires immediately
    const { data: pendingOrder } = await supabase.rpc('create_pending_order_with_slot', {
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
        cart_items: [
          { menu_item_id: '00000000-0000-0000-0000-000000000001', name: 'Test Item', price: '25.00', quantity: 1 }
        ]
      }
    });
    
    // Manually expire the order
    await supabase
      .from('orders')
      .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
      .eq('id', pendingOrder[0].order_id);
    
    // Fill the slot completely
    await supabase
      .from('time_slots')
      .update({ current_orders: 1 })
      .eq('id', slot.id);
    
    // Try to process webhook - should fail
    try {
      await supabase.rpc('process_webhook_atomically', {
        p_event_id: eventId,
        p_session_id: sessionId,
        p_payment_intent: 'pi_test_456',
        p_tenant_id: TEST_TENANT_ID
      });
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain('expired');
    }
    
    // Critical alert should exist
    const { data: alerts } = await supabase
      .from('webhook_alerts')
      .select('*')
      .eq('session_id', sessionId)
      .eq('alert_type', 'expired_order_paid')
      .eq('severity', 'critical');
    
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].metadata.requires_refund).toBe(true);
  });
  
  test('Expired order with available slot auto-recovers', async () => {
    const sessionId = `sess_test_expired_recover_${Date.now()}`;
    const eventId = `evt_test_expired_recover_${Date.now()}`;
    
    // Create a slot with capacity
    const slotTime = new Date(Date.now() + 86400000);
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
    const { data: pendingOrder } = await supabase.rpc('create_pending_order_with_slot', {
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
        cart_items: [
          { menu_item_id: '00000000-0000-0000-0000-000000000001', name: 'Test Item', price: '25.00', quantity: 1 }
        ]
      }
    });
    
    // Manually expire the order
    await supabase
      .from('orders')
      .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
      .eq('id', pendingOrder[0].order_id);
    
    // Process webhook - should auto-recover
    const { data: result } = await supabase.rpc('process_webhook_atomically', {
      p_event_id: eventId,
      p_session_id: sessionId,
      p_payment_intent: 'pi_test_789',
      p_tenant_id: TEST_TENANT_ID
    });
    
    expect(result.status).toBe('success');
    expect(result.was_expired).toBe(true);
    expect(result.auto_recovered).toBe(true);
    
    // Order should be paid
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', pendingOrder[0].order_id)
      .single();
    
    expect(order.payment_status).toBe('paid');
    
    // Medium-severity alert should exist
    const { data: alerts } = await supabase
      .from('webhook_alerts')
      .select('*')
      .eq('session_id', sessionId)
      .eq('alert_type', 'expired_order_paid')
      .eq('severity', 'medium');
    
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].metadata.auto_recovered).toBe(true);
  });
  
  test('Webhook logs error to alerts table on failure', async () => {
    const sessionId = `sess_test_no_pending_${Date.now()}`;
    const eventId = `evt_test_no_pending_${Date.now()}`;
    
    // Try to process webhook without creating pending order first
    try {
      await supabase.rpc('process_webhook_atomically', {
        p_event_id: eventId,
        p_session_id: sessionId,
        p_payment_intent: 'pi_test_999',
        p_tenant_id: TEST_TENANT_ID
      });
      
      expect(true).toBe(false); // Should not reach
    } catch (error: any) {
      expect(error.message).toContain('No pending order found');
    }
    
    // Alert should be logged
    const { data: alerts } = await supabase
      .from('webhook_alerts')
      .select('*')
      .eq('session_id', sessionId)
      .eq('alert_type', 'webhook_failure');
    
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].severity).toBe('critical');
  });
});

