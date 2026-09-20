CREATE INDEX IF NOT EXISTS idx_entries_day_date_user ON entries(day_date, user_id);
CREATE INDEX IF NOT EXISTS idx_entries_product_id ON entries(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_scope_created ON audit_log(scope_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_user_archived ON products(user_id, archived_at);
CREATE INDEX IF NOT EXISTS idx_days_user_closed ON days(user_id, closed_at);
