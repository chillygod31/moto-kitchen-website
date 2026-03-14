-- Event Planner tables

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  event_type TEXT NOT NULL DEFAULT 'festival'
    CHECK (event_type IN ('private', 'festival', 'market', 'corporate')),
  expected_guests INTEGER,
  location TEXT,
  notes TEXT,
  pack_level TEXT DEFAULT 'pack1' CHECK (pack_level IN ('pack1', 'pack2', 'custom')),
  status TEXT NOT NULL DEFAULT 'planning'
    CHECK (status IN ('planning', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_tenant ON events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS event_prep_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT,
  planned_qty INTEGER NOT NULL DEFAULT 0,
  planned_kg NUMERIC(10,2),
  planned_boxes INTEGER,
  cost_per_kg NUMERIC(10,2),
  sell_price NUMERIC(10,2),
  actual_qty_sold INTEGER,
  actual_revenue NUMERIC(10,2),
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_prep_items_event ON event_prep_items(event_id);
