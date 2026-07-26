#!/usr/bin/env bash
# Restore Postgres from a gzipped pg_dump produced by scripts/backup.sh.
# Usage:
#   ./scripts/restore-db.sh                     # uses backups/db-latest.sql.gz
#   ./scripts/restore-db.sh backups/db-....sql.gz
#
# WARNING: replaces data in POSTGRES_DB. Confirms unless RESTORE_YES=1.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "error: .env not found in $ROOT" >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a
# shellcheck source=/dev/null
source .env
set +a

: "${POSTGRES_USER:?POSTGRES_USER missing in .env}"
: "${POSTGRES_DB:?POSTGRES_DB missing in .env}"

DUMP="${1:-$ROOT/backups/db-latest.sql.gz}"

if [[ ! -f "$DUMP" ]]; then
  echo "error: dump not found: $DUMP" >&2
  exit 1
fi

echo "About to RESTORE into database '$POSTGRES_DB' from:"
echo "  $DUMP"
echo "This overwrites existing tables/data."

if [[ "${RESTORE_YES:-}" != "1" ]]; then
  read -r -p "Type YES to continue: " confirm
  if [[ "$confirm" != "YES" ]]; then
    echo "aborted"
    exit 1
  fi
fi

echo "==> Restoring…"
gunzip -c "$DUMP" | docker compose exec -T db \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1

echo "==> Restore finished. Restart web if needed:"
echo "    docker compose restart web"
