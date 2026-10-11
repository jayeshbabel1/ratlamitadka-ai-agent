PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS store_connections (
  id TEXT PRIMARY KEY,
  store_url TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  connection_status TEXT NOT NULL DEFAULT 'not_connected',
  last_successful_sync_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  store_connection_id TEXT NOT NULL REFERENCES store_connections(id),
  woo_order_id INTEGER NOT NULL,
  order_number TEXT NOT NULL,
  status TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  created_at_utc TEXT NOT NULL,
  paid_at_utc TEXT,
  updated_at_utc TEXT NOT NULL,
  subtotal_minor INTEGER NOT NULL DEFAULT 0,
  discount_minor INTEGER NOT NULL DEFAULT 0,
  shipping_minor INTEGER NOT NULL DEFAULT 0,
  tax_minor INTEGER NOT NULL DEFAULT 0,
  total_minor INTEGER NOT NULL DEFAULT 0,
  refunded_minor INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_reference TEXT,
  customer_hash TEXT,
  dispatch_status TEXT NOT NULL DEFAULT 'unknown',
  dispatched_at_utc TEXT,
  raw_status_source TEXT,
  last_synced_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(store_connection_id, woo_order_id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  woo_product_id INTEGER,
  variation_id INTEGER,
  product_name_snapshot TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  line_subtotal_minor INTEGER NOT NULL DEFAULT 0,
  line_total_minor INTEGER NOT NULL DEFAULT 0,
  line_tax_minor INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS order_alerts (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  threshold_at_utc TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  evidence_json TEXT NOT NULL DEFAULT '{}',
  first_triggered_at_utc TEXT NOT NULL,
  last_triggered_at_utc TEXT NOT NULL,
  resolved_at_utc TEXT,
  resolution_reason TEXT,
  occurrence_number INTEGER NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_alert_rule
  ON order_alerts(order_id, rule_type, status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at_utc);
CREATE INDEX IF NOT EXISTS idx_orders_status_updated ON orders(status, updated_at_utc);
CREATE INDEX IF NOT EXISTS idx_alerts_status_severity ON order_alerts(status, severity);
CREATE INDEX IF NOT EXISTS idx_alerts_threshold ON order_alerts(threshold_at_utc);

CREATE TABLE IF NOT EXISTS daily_reports (
  id TEXT PRIMARY KEY,
  store_connection_id TEXT NOT NULL REFERENCES store_connections(id),
  report_date_ist TEXT NOT NULL,
  cutoff_at_utc TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  metrics_json TEXT NOT NULL,
  comparison_json TEXT NOT NULL,
  alerts_json TEXT NOT NULL,
  generated_at_utc TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'generated',
  error_message TEXT,
  UNIQUE(store_connection_id, report_date_ist, cutoff_at_utc)
);

CREATE TABLE IF NOT EXISTS approval_requests (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id),
  action_type TEXT NOT NULL,
  proposed_payload_json TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL,
  reason TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  approved_by TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at_utc TEXT NOT NULL,
  expires_at_utc TEXT NOT NULL,
  approved_at_utc TEXT,
  executed_at_utc TEXT,
  execution_result_json TEXT
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  event_key TEXT NOT NULL UNIQUE,
  topic TEXT NOT NULL,
  resource_id TEXT,
  received_at_utc TEXT NOT NULL,
  signature_valid INTEGER NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'received',
  attempts INTEGER NOT NULL DEFAULT 0,
  processed_at_utc TEXT,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  before_json TEXT,
  after_json TEXT,
  approval_id TEXT,
  request_id TEXT,
  created_at_utc TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_runs (
  id TEXT PRIMARY KEY,
  sync_type TEXT NOT NULL,
  started_at_utc TEXT NOT NULL,
  finished_at_utc TEXT,
  cursor TEXT,
  items_seen INTEGER NOT NULL DEFAULT 0,
  items_changed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  error_message TEXT
);
