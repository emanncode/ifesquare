PRAGMA foreign_keys = OFF;

ALTER TABLE products ADD COLUMN user_id INTEGER REFERENCES users(id);
UPDATE products SET user_id = COALESCE((SELECT id FROM users LIMIT 1), 0) WHERE user_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);

CREATE TABLE IF NOT EXISTS __days_new (
  user_id   INTEGER NOT NULL REFERENCES users(id),
  date      TEXT NOT NULL,
  closed_at TIMESTAMP,
  PRIMARY KEY (user_id, date)
);
INSERT OR IGNORE INTO __days_new SELECT COALESCE((SELECT id FROM users LIMIT 1), 0), date, closed_at FROM days;
DROP TABLE IF EXISTS days;
ALTER TABLE __days_new RENAME TO days;

CREATE TABLE IF NOT EXISTS __entries_new (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  day_date    TEXT NOT NULL,
  product_id  INTEGER NOT NULL REFERENCES products(id),
  opening     INTEGER NOT NULL DEFAULT 0,
  receipts    INTEGER NOT NULL DEFAULT 0,
  closing     INTEGER,
  price       INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, day_date, product_id)
);
INSERT OR IGNORE INTO __entries_new SELECT id, COALESCE((SELECT id FROM users LIMIT 1), 0), day_date, product_id, opening, receipts, closing, price, created_at, updated_at FROM entries;
DROP TABLE IF EXISTS entries;
ALTER TABLE __entries_new RENAME TO entries;

PRAGMA foreign_keys = ON;
