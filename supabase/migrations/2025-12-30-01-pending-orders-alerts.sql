-- ============================================================================
-- P0 Payment Safety Migration 1: Pending Orders, Alerts, and Email Queue
-- ============================================================================

-- ============================================================================
-- 1. Add pending order support
-- ============================================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Update payment_status check to include 'pending' and 'expired'
ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_payment_status_check 
  CHECK (payment_status IN ('pending', 'unpaid', 'paid', 'refunded', 'expired'));

-- Add index for session lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_expires_at ON orders(expires_at) WHERE payment_status = 'pending';

-- ============================================================================
-- 2. Create webhook alerts table
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhook_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'webhook_failure', 
    'expired_order_paid', 
    'slot_overbooking', 
    'email_failure'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  session_id TEXT,
  order_id UUID REFERENCES orders(id),
  error_message TEXT,
  metadata JSONB,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_alerts_tenant ON webhook_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_alerts_unacknowledged ON webhook_alerts(tenant_id, acknowledged) 
  WHERE acknowledged = false;
CREATE INDEX IF NOT EXISTS idx_webhook_alerts_severity ON webhook_alerts(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_alerts_session ON webhook_alerts(session_id);

-- ============================================================================
-- 3. Create email queue table
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('customer_confirmation', 'admin_alert')),
  template_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_pending ON email_queue(status, attempts) 
  WHERE status = 'pending' AND attempts < 3;
CREATE INDEX IF NOT EXISTS idx_email_queue_order ON email_queue(order_id);

-- ============================================================================
-- 4. Add unique constraint on webhook_events.stripe_event_id
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_stripe_event_id'
  ) THEN
    ALTER TABLE webhook_events
      ADD CONSTRAINT unique_stripe_event_id UNIQUE (stripe_event_id);
  END IF;
END $$;

-- ============================================================================
-- 5. Create cron job tracking table
-- ============================================================================
CREATE TABLE IF NOT EXISTS cron_job_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name TEXT NOT NULL,
  run_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  records_processed INTEGER,
  error_message TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_cron_job_runs_name ON cron_job_runs(job_name, run_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_job_runs_recent ON cron_job_runs(run_at DESC);

