#!/usr/bin/env bash
# Assembles + provisions a local Drupal instance via drupal/.devtools/ (PHP +
# SQLite, no DDEV) with Simple OAuth (drupal/scripts/provision-simple-oauth.sh),
# runs push-story.mjs to push an article into Drupal via JSON:API, then
# exports the new content via `drush tome:content-export`.
#
# Usage:
#   .gitlab/scripts/run-drupal-push-story.sh
#
# Environment:
#   PUSH_FILE       Path to the article JSON (default: field-tokens article)
#   WEBSERVER_HOST  PHP server host (default: 127.0.0.1)
#   WEBSERVER_PORT  PHP server port (default: 8888)
set -euo pipefail

cd "$(dirname "$0")/../.."
cd drupal

export WEBSERVER_HOST="${WEBSERVER_HOST:-127.0.0.1}"
export WEBSERVER_PORT="${WEBSERVER_PORT:-8888}"
export DB_FILE="${DB_FILE:-/tmp/stuartclark-push.sqlite}"
export PROVISION_SIMPLE_OAUTH=1
OAUTH_PRIVATE_KEY="${OAUTH_PRIVATE_KEY:-/tmp/stuartclark-oauth-private.key}"
OAUTH_PUBLIC_KEY="${OAUTH_PUBLIC_KEY:-/tmp/stuartclark-oauth-public.key}"
export OAUTH_PRIVATE_KEY OAUTH_PUBLIC_KEY
CLIENT_SECRET="${STORY_SYNC_CLIENT_SECRET:-local-push-story-secret}"
export STORY_SYNC_CLIENT_SECRET="$CLIENT_SECRET"
SCOPE="${STORY_SYNC_SCOPE:-story_sync}"
export STORY_SYNC_SCOPE="$SCOPE"
PUSH_FILE="${PUSH_FILE:-../nuxt/content/articles-data/field-tokens-200-20260722.json}"

.devtools/assemble
.devtools/provision
CLIENT_ID=$(cat /tmp/stuartclark-client-id.txt)
echo "==> client_id: $CLIENT_ID"

.devtools/start
trap '.devtools/stop >/dev/null 2>&1 || true' EXIT

echo "==> installing druxt (patched) in nuxt/"
if ! command -v pnpm &>/dev/null; then
  corepack enable
  corepack prepare pnpm@10 --activate
fi
pnpm --dir ../nuxt install --frozen-lockfile

echo "==> running push-story.mjs"
node ../nuxt/scripts/push-story.mjs \
  --base-url="http://$WEBSERVER_HOST:$WEBSERVER_PORT" \
  --file="$PUSH_FILE" \
  --client-id="$CLIENT_ID" \
  --client-secret="$CLIENT_SECRET" \
  --scope="$SCOPE"

echo "==> exporting content via tome:content-export"
vendor/bin/drush tome:content-export -y

echo "==> done — new Tome export files are in drupal/content/"
