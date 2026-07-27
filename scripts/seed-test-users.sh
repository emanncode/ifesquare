#!/usr/bin/env bash
# Seed script for creating owner + staff test accounts locally.
# Usage: ./scripts/seed-test-users.sh
#
# Requires: DB_PATH env var or defaults to ./ifesquare.db

set -euo pipefail

DB="${DB_PATH:-./ifesquare.db}"

if [ ! -f "$DB" ]; then
  echo "Error: Database file not found at $DB"
  echo "Start the server first to create the database, or set DB_PATH."
  exit 1
fi

OWNER_EMAIL="${OWNER_EMAIL:-owner@test.com}"
OWNER_PASSWORD="${OWNER_PASSWORD:-password123}"
STAFF_EMAIL="${STAFF_EMAIL:-staff@test.com}"
STAFF_PASSWORD="${STAFF_PASSWORD:-password123}"

echo "Seeding test users in $DB..."

# Create owner account
sqlite3 "$DB" <<SQL
INSERT OR IGNORE INTO users (email, password_hash, role)
VALUES (
  '$OWNER_EMAIL',
  -- bcrypt hash of 'password123'
  '\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'owner'
);
SQL

OWNER_ID=$(sqlite3 "$DB" "SELECT id FROM users WHERE email='$OWNER_EMAIL';")
if [ -z "$OWNER_ID" ]; then
  echo "Error: Failed to create or find owner user"
  exit 1
fi
echo "  Owner: $OWNER_EMAIL (id=$OWNER_ID)"

# Create staff account under owner
sqlite3 "$DB" <<SQL
INSERT OR IGNORE INTO users (email, password_hash, role, owner_id)
VALUES (
  '$STAFF_EMAIL',
  -- bcrypt hash of 'password123'
  '\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'staff',
  $OWNER_ID
);
SQL

STAFF_ID=$(sqlite3 "$DB" "SELECT id FROM users WHERE email='$STAFF_EMAIL';")
if [ -n "$STAFF_ID" ]; then
  echo "  Staff: $STAFF_EMAIL (id=$STAFF_ID, owner_id=$OWNER_ID)"
else
  echo "  Warning: Staff user may already exist"
fi

echo ""
echo "Done! Test accounts:"
echo "  Owner login:  $OWNER_EMAIL / $OWNER_PASSWORD"
echo "  Staff login:  $STAFF_EMAIL / $STAFF_PASSWORD"
echo ""
echo "Note: These are bcrypt hashes of 'password123'. Change passwords in production!"
