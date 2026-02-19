-- ============================================================================
-- Invoice History Table
-- Stores generated invoices/quotes for persistence across browsers/devices
-- ============================================================================

-- Invoice History Table (for generated invoices/quotes)
CREATE TABLE IF NOT EXISTS invoice_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

  -- Invoice identifiers
  document_type TEXT NOT NULL CHECK (document_type IN ('invoice', 'quote', 'embassyInvoice')),
  document_number TEXT NOT NULL,
  client_name TEXT NOT NULL,

  -- Full form data (stored as JSON for flexibility)
  form_data JSONB NOT NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoice_history_tenant ON invoice_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoice_history_created_at ON invoice_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_history_document_type ON invoice_history(document_type);
CREATE INDEX IF NOT EXISTS idx_invoice_history_document_number ON invoice_history(document_number);

-- RLS policies
ALTER TABLE invoice_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Tenant members can view their invoices" ON invoice_history;
DROP POLICY IF EXISTS "Tenant members can insert invoices" ON invoice_history;
DROP POLICY IF EXISTS "Tenant members can delete their invoices" ON invoice_history;

CREATE POLICY "Tenant members can view their invoices" ON invoice_history
  FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Tenant members can insert invoices" ON invoice_history
  FOR INSERT WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Tenant members can delete their invoices" ON invoice_history
  FOR DELETE USING (tenant_id IN (
    SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
  ));

-- Trigger for updated_at (reuse existing function)
DROP TRIGGER IF EXISTS update_invoice_history_updated_at ON invoice_history;
CREATE TRIGGER update_invoice_history_updated_at
  BEFORE UPDATE ON invoice_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
