CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  price       INTEGER NOT NULL DEFAULT 0,
  stock       INTEGER NOT NULL DEFAULT 0,
  archived_at TIMESTAMP,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  low_stock_threshold INTEGER
);

CREATE TABLE IF NOT EXISTS days (
  user_id   INTEGER NOT NULL REFERENCES users(id),
  date      TEXT NOT NULL,
  closed_at TIMESTAMP,
  PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS entries (
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
