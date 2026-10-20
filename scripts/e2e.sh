#!/usr/bin/env bash
set -uo pipefail

set -a; source .env.test; set +a

LOG_DIR="logs/e2e"
DC="docker compose -p e2e -f apps/api/docker-compose.e2e.yml --env-file .env.test"

save_logs() {
  mkdir -p "$LOG_DIR"
  # un fichier global, horodaté, tous services confondus
  $DC logs --no-color --timestamps > "$LOG_DIR/docker.log" 2>&1
  # un fichier par service
  for svc in $($DC config --services); do
    $DC logs --no-color --timestamps "$svc" > "$LOG_DIR/$svc.log" 2>&1
  done
}

cleanup() {
  code=$?
  save_logs
  pnpm --filter api -s e2e:down
  [ $code -ne 0 ] && echo "Logs Docker : $LOG_DIR/" >&2
  exit $code
}
trap cleanup EXIT INT TERM

echo "Starting container..."
if ! pnpm --filter api -s e2e:up; then
  exit 1
fi

pnpm turbo run test:e2e --concurrency=1 --log-prefix=none --log-order=stream || exit 1