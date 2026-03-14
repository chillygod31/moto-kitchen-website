-- Event item defaults: stores default cost/price per item for auto-populating new events

CREATE TABLE IF NOT EXISTS event_item_defaults (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT,
  cost_per_kg NUMERIC(10,2),
  cost_per_piece NUMERIC(10,2),
  default_sell_price NUMERIC(10,2),
  unit TEXT DEFAULT 'kg' CHECK (unit IN ('kg', 'piece', 'box')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, item_name)
);

CREATE INDEX IF NOT EXISTS idx_event_item_defaults_tenant ON event_item_defaults(tenant_id);

CREATE TRIGGER update_event_item_defaults_updated_at
  BEFORE UPDATE ON event_item_defaults
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
