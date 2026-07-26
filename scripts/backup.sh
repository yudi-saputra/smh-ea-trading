#!/usr/bin/env bash
# Backup Postgres + banner/data volumes. Run from project root on the VPS.
# Usage: ./scripts/backup.sh
# Env: BACKUP_DIR (default ./backups), BACKUP_KEEP_DAYS (default 14)

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

BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DAY="$(date +%Y-%m-%d)"

mkdir -p "$BACKUP_DIR"

echo "==> DB dump → $BACKUP_DIR/db-$STAMP.sql.gz"
docker compose exec -T db \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl \
  | gzip -c >"$BACKUP_DIR/db-$STAMP.sql.gz"

# Also keep a same-day “latest” pointer for easy restore drills
ln -sfn "db-$STAMP.sql.gz" "$BACKUP_DIR/db-latest.sql.gz"

if docker compose ps --status running --services 2>/dev/null | grep -qx web; then
  echo "==> App data → $BACKUP_DIR/data-$STAMP.tar.gz"
  docker compose exec -T web tar -C /app -czf - data \
    >"$BACKUP_DIR/data-$STAMP.tar.gz"

  echo "==> Banners → $BACKUP_DIR/banners-$STAMP.tar.gz"
  docker compose exec -T web tar -C /app/public -czf - banners \
    >"$BACKUP_DIR/banners-$STAMP.tar.gz"

  ln -sfn "data-$STAMP.tar.gz" "$BACKUP_DIR/data-latest.tar.gz"
  ln -sfn "banners-$STAMP.tar.gz" "$BACKUP_DIR/banners-latest.tar.gz"
else
  echo "warn: web not running — skipped data/banners volume backup" >&2
fi

echo "==> Retention: delete backups older than ${KEEP_DAYS} days"
find "$BACKUP_DIR" -maxdepth 1 -type f \( \
  -name 'db-*.sql.gz' -o -name 'data-*.tar.gz' -o -name 'banners-*.tar.gz' \
\) -mtime "+${KEEP_DAYS}" -print -delete || true

echo "==> Done ($DAY)"
ls -lh "$BACKUP_DIR"/db-"$STAMP".sql.gz \
  "$BACKUP_DIR"/data-"$STAMP".tar.gz \
  "$BACKUP_DIR"/banners-"$STAMP".tar.gz 2>/dev/null || true
