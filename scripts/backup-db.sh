#!/usr/bin/env bash
set -euo pipefail

# Daily Turso DB backup script.
# Usage: ./scripts/backup-db.sh [output-directory]
#
# Expects:
#   TURSO_DATABASE_NAME — the Turso DB name (default: "ifesquare")
#   TURSO_AUTH_TOKEN    — Turso auth token (from .env or env var)
#
# The Turso CLI (`turso`) must be installed and authenticated.

OUTPUT_DIR="${1:-./backups}"
DB_NAME="${TURSO_DATABASE_NAME:-ifesquare}"
TIMESTAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
BACKUP_FILE="${OUTPUT_DIR}/ifesquare-${TIMESTAMP}.sql"

mkdir -p "$OUTPUT_DIR"

if ! command -v turso &>/dev/null; then
  echo "Error: 'turso' CLI not found. Install from https://turso.tech" >&2
  exit 1
fi

echo "Dumping database '${DB_NAME}' to ${BACKUP_FILE}..."
turso db shell "$DB_NAME" ".dump" > "$BACKUP_FILE"

# Gzip the dump
gzip -f "$BACKUP_FILE"
echo "Backup written: ${BACKUP_FILE}.gz ($(du -h "${BACKUP_FILE}.gz" | cut -f1))"

# Keep only the last 30 backups
find "$OUTPUT_DIR" -name "ifesquare-*.sql.gz" -type f | sort | head -n -30 | xargs -r rm

echo "Done."
