#!/usr/bin/env bash
# Restore banners + data tarballs into the running web container volumes.
# Usage:
#   ./scripts/restore-app-files.sh
#   ./scripts/restore-app-files.sh backups/data-....tar.gz backups/banners-....tar.gz

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DATA_TAR="${1:-$ROOT/backups/data-latest.tar.gz}"
BANNERS_TAR="${2:-$ROOT/backups/banners-latest.tar.gz}"

if [[ "${RESTORE_YES:-}" != "1" ]]; then
  echo "Restores:"
  echo "  data    ← $DATA_TAR"
  echo "  banners ← $BANNERS_TAR"
  read -r -p "Type YES to continue: " confirm
  if [[ "$confirm" != "YES" ]]; then
    echo "aborted"
    exit 1
  fi
fi

if [[ -f "$DATA_TAR" ]]; then
  echo "==> Restoring /app/data"
  docker compose exec -T web sh -c 'rm -rf /app/data/*'
  docker compose exec -T web tar -C /app -xzf - <"$DATA_TAR"
else
  echo "warn: skip data — missing $DATA_TAR" >&2
fi

if [[ -f "$BANNERS_TAR" ]]; then
  echo "==> Restoring /app/public/banners"
  docker compose exec -T web sh -c 'rm -rf /app/public/banners/*'
  docker compose exec -T web tar -C /app/public -xzf - <"$BANNERS_TAR"
else
  echo "warn: skip banners — missing $BANNERS_TAR" >&2
fi

echo "==> Done"
