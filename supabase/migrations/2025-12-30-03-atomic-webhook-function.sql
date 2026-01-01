-- ============================================================================
-- P0 Payment Safety Migration 3: Atomic Webhook Processing with Expiry Handling
-- ============================================================================

-- ============================================================================
-- Add unique constraint on payments.order_id if it doesn't exist
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payments_order_id_key'
  ) THEN
    ALTER TABLE payments
      ADD CONSTRAINT payments_order_id_key UNIQUE (order_id);
  END IF;
END $$;

-- ============================================================================
-- Atomic Webhook Processing Function
-- ============================================================================
CREATE OR REPLACE FUNCTION process_webhook_atomically(
  p_event_id TEXT,
  p_session_id TEXT,
  p_payment_intent TEXT,
  p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_expires_at TIMESTAMPTZ;
  v_slot_id UUID;
  v_slot_available BOOLEAN;
  v_is_expired BOOLEAN := false;
BEGIN
  -- 1. Insert webhook event (deduplication via unique constraint)
  BEGIN
    INSERT INTO webhook_events (
      stripe_event_id, 
      event_type, 
      payload, 
      processed,
      created_at
    ) VALUES (
      p_event_id,
      'checkout.session.completed',
      jsonb_build_object(
        'session_id', p_session_id,
        'payment_intent', p_payment_intent,
        'tenant_id', p_tenant_id
      ),
      false,
      NOW()
    );
  EXCEPTION WHEN unique_violation THEN
    -- SAFETY: Event ID exists, but verify it was actually processed successfully
    -- Only return "already_processed" if webhook_events.processed=true AND order is paid
    DECLARE
      v_webhook_processed BOOLEAN;
      v_order_payment_status TEXT;
    BEGIN
      -- Check webhook event status
      SELECT processed INTO v_webhook_processed
      FROM webhook_events
      WHERE stripe_event_id = p_event_id;
      
      -- Check order payment status
      SELECT o.id, o.order_number, o.payment_status
      INTO v_order_id, v_order_number, v_order_payment_status
      FROM orders o
      WHERE o.stripe_session_id = p_session_id
        AND o.tenant_id = p_tenant_id;
      
      -- SAFE: Webhook marked processed AND order is paid
      IF v_webhook_processed = true AND v_order_payment_status = 'paid' THEN
        RETURN jsonb_build_object(
          'status', 'already_processed',
          'order_id', v_order_id,
          'order_number', v_order_number
        );
      END IF;
      
      -- DANGER: Event exists but processing incomplete
      -- Log critical alert and re-raise to force retry
      INSERT INTO webhook_alerts (
        tenant_id,
        alert_type,
        severity,
        session_id,
        order_id,
        error_message,
        metadata
      ) VALUES (
        p_tenant_id,
        'webhook_failure',
        'critical',
        p_session_id,
        v_order_id,
        'Duplicate event_id but order not paid - previous webhook may have failed',
        jsonb_build_object(
          'event_id', p_event_id,
          'webhook_processed', v_webhook_processed,
          'order_status', v_order_payment_status,
          'payment_intent', p_payment_intent
        )
      );
      
      RAISE EXCEPTION 'Duplicate event_id % but order % not paid (status: %). Previous webhook failed - retrying.',
        p_event_id, v_order_number, v_order_payment_status;
    END;
  END;
  
  -- 2. Find pending order by session_id
  SELECT id, order_number, expires_at, time_slot_id 
  INTO v_order_id, v_order_number, v_expires_at, v_slot_id
  FROM orders
  WHERE stripe_session_id = p_session_id
    AND tenant_id = p_tenant_id
    AND payment_status = 'pending';
  
  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'No pending order found for session %', p_session_id;
  END IF;
  
  -- 3. Check if order expired
  IF v_expires_at < NOW() THEN
    v_is_expired := true;
    
    -- Check if slot still has capacity
    IF v_slot_id IS NOT NULL THEN
      SELECT (current_orders < max_orders OR max_orders IS NULL) AND is_active
      INTO v_slot_available
      FROM time_slots
      WHERE id = v_slot_id;
      
      IF NOT v_slot_available THEN
        -- Slot is full or inactive - cannot accept payment
        INSERT INTO webhook_alerts (
          tenant_id,
          alert_type,
          severity,
          session_id,
          order_id,
          error_message,
          metadata
        ) VALUES (
          p_tenant_id,
          'expired_order_paid',
          'critical',
          p_session_id,
          v_order_id,
          'Customer paid after order expired and slot is now full',
          jsonb_build_object(
            'requires_refund', true,
            'order_number', v_order_number,
            'slot_id', v_slot_id,
            'payment_intent', p_payment_intent
          )
        );
        
        RAISE EXCEPTION 'Order % expired and slot % is full - requires manual refund', 
          v_order_number, v_slot_id;
      ELSE
        -- Slot available, re-book it
        UPDATE time_slots
        SET current_orders = current_orders + 1
        WHERE id = v_slot_id;
        
        -- Create alert for monitoring (non-critical)
        INSERT INTO webhook_alerts (
          tenant_id,
          alert_type,
          severity,
          session_id,
          order_id,
          error_message,
          metadata
        ) VALUES (
          p_tenant_id,
          'expired_order_paid',
          'medium',
          p_session_id,
          v_order_id,
          'Customer paid after order expired but slot was re-booked successfully',
          jsonb_build_object(
            'auto_recovered', true,
            'order_number', v_order_number,
            'slot_id', v_slot_id
          )
        );
      END IF;
    END IF;
  END IF;
  
  -- 4. Update order to paid
  UPDATE orders
  SET 
    payment_status = 'paid',
    stripe_payment_intent_id = p_payment_intent,
    expires_at = NULL,
    email_status = 'pending'
  WHERE id = v_order_id;
  
  -- 5. Update or create payment record
  INSERT INTO payments (
    order_id,
    provider,
    provider_reference,
    stripe_session_id,
    stripe_payment_intent_id,
    amount,
    status
  )
  SELECT 
    v_order_id,
    'stripe',
    p_session_id,
    p_session_id,
    p_payment_intent,
    o.total,
    'completed'
  FROM orders o
  WHERE o.id = v_order_id
  ON CONFLICT (order_id) DO UPDATE
  SET 
    stripe_payment_intent_id = p_payment_intent,
    status = 'completed';
  
  -- 6. Queue confirmation emails
  INSERT INTO email_queue (order_id, recipient, email_type, status)
  SELECT 
    v_order_id,
    o.customer_email,
    'customer_confirmation',
    'pending'
  FROM orders o
  WHERE o.id = v_order_id 
    AND o.customer_email IS NOT NULL 
    AND o.customer_email != '';
  
  INSERT INTO email_queue (order_id, recipient, email_type, status)
  SELECT 
    v_order_id,
    t.business_email,
    'admin_alert',
    'pending'
  FROM orders o
  JOIN tenants t ON t.id = o.tenant_id
  WHERE o.id = v_order_id 
    AND t.business_email IS NOT NULL 
    AND t.business_email != '';
  
  -- 7. Mark webhook as processed
  UPDATE webhook_events
  SET processed = true
  WHERE stripe_event_id = p_event_id;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'order_id', v_order_id,
    'order_number', v_order_number,
    'was_expired', v_is_expired,
    'auto_recovered', v_is_expired AND v_slot_available
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Transaction will auto-rollback all changes (including webhook_events insert)
  -- Stripe will retry with a clean slate
  
  -- Attempt to log error (may fail if in bad state, but we must re-raise anyway)
  BEGIN
    INSERT INTO webhook_alerts (
      tenant_id,
      alert_type,
      severity,
      session_id,
      error_message,
      metadata
    ) VALUES (
      p_tenant_id,
      'webhook_failure',
      'critical',
      p_session_id,
      SQLERRM,
      jsonb_build_object(
        'event_id', p_event_id,
        'payment_intent', p_payment_intent,
        'error_detail', SQLSTATE
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Alert logging failed (e.g. in nested transaction)
    -- Continue to re-raise original error so webhook returns 500
    NULL;
  END;
  
  -- CRITICAL: Re-raise so webhook returns 500 and Stripe retries
  -- DO NOT swallow this exception or order will be lost
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

