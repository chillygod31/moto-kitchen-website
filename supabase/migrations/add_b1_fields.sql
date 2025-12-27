-- Phase B1 Database Migrations
-- Adds fields needed for tenant settings, menu publishing, orders, payments, and webhooks

-- ============================================================================
-- 1. Add fields to tenant_business_settings
-- ============================================================================
ALTER TABLE tenant_business_settings
  ADD COLUMN IF NOT EXISTS pickup_address TEXT,
  ADD COLUMN IF NOT EXISTS pickup_instructions TEXT,
  ADD COLUMN IF NOT EXISTS blackout_dates DATE[],
  ADD COLUMN IF NOT EXISTS order_notes_max_length INTEGER DEFAULT 500,
  ADD COLUMN IF NOT EXISTS order_notes_policy TEXT DEFAULT 'Free text, max 500 characters. No special characters allowed.';

-- ============================================================================
-- 2. Add fields to tenants table
-- ============================================================================
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS business_email TEXT,
  ADD COLUMN IF NOT EXISTS business_phone TEXT;

-- ============================================================================
-- 3. Add is_published to menu_items
-- ============================================================================
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- ============================================================================
-- 4. Add admin_notes to orders
-- ============================================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- ============================================================================
-- 5. Add email tracking fields to orders
-- ============================================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS email_status TEXT CHECK (email_status IN ('pending', 'sent', 'failed', 'retry'));

-- ============================================================================
-- 6. Add Stripe fields to payments table
-- ============================================================================
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add index for Stripe session lookups
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session_id ON payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);

-- ============================================================================
-- 7. Create webhook_events table
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for webhook event lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- ============================================================================
-- 8. Add max_orders_per_day to tenant_business_settings
-- ============================================================================
ALTER TABLE tenant_business_settings
  ADD COLUMN IF NOT EXISTS max_orders_per_day INTEGER;

