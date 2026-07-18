PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS __products_new (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  price       INTEGER NOT NULL DEFAULT 0,
  stock       INTEGER NOT NULL DEFAULT 0,
  archived_at TIMESTAMP,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  low_stock_threshold INTEGER
);
INSERT OR IGNORE INTO __products_new SELECT id, name, price, stock, archived_at, created_at, user_id, low_stock_threshold FROM products;
DROP TABLE IF EXISTS products;
ALTER TABLE __products_new RENAME TO products;
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);

PRAGMA foreign_keys = ON;
