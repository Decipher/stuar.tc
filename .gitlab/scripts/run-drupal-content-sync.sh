#!/usr/bin/env bash
# Assembles + provisions a local Drupal instance via drupal/.devtools/ (PHP +
# SQLite, no Docker/DDEV) and runs nuxt/scripts/sync-content.mjs against it.
# Same script for local dev and GitLab CI.
set -euo pipefail

cd "$(dirname "$0")/../.."
cd drupal

export WEBSERVER_HOST="${WEBSERVER_HOST:-127.0.0.1}"
export WEBSERVER_PORT="${WEBSERVER_PORT:-8888}"
export DB_FILE="${DB_FILE:-/tmp/stuartclark-sync.sqlite}"

.devtools/assemble
.devtools/provision
.devtools/start
trap '.devtools/stop >/dev/null 2>&1 || true' EXIT

echo "==> installing druxt (patched) in nuxt/"
if ! command -v pnpm &>/dev/null; then
  corepack enable
  corepack prepare pnpm@10 --activate
fi
pnpm --dir ../nuxt install --frozen-lockfile

echo "==> running content sync"
node ../nuxt/scripts/sync-content.mjs \
  --base-url="http://$WEBSERVER_HOST:$WEBSERVER_PORT" \
  --files-dir="$(pwd)/files/public"
