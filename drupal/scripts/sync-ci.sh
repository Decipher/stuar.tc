#!/usr/bin/env bash
# Installs Drupal via Composer + SQLite (no Docker/DDEV) and runs
# sync-content.mjs against it. Same script for local dev and GitLab CI —
# only needs PHP, Composer, and Node, all of which run natively in any CI
# image without the Docker-in-Docker networking issues DDEV hit here.
set -euo pipefail

cd "$(dirname "$0")/.."

WEBSERVER_HOST="${WEBSERVER_HOST:-127.0.0.1}"
WEBSERVER_PORT="${WEBSERVER_PORT:-8888}"
DB_FILE="${DB_FILE:-/tmp/stuartclark-sync.sqlite}"

echo "==> composer install"
composer install --no-interaction --no-progress

echo "==> enabling the sqlite module in this checkout only (never committed)"
# Drupal refuses to uninstall the module providing its active DB driver, and
# the committed config/sync (authored against MySQL/DDEV) doesn't list
# `sqlite` as enabled. Patch the ephemeral checkout only.
php -r '
$path = "config/sync/core.extension.yml";
$content = file_get_contents($path);
if (!str_contains($content, "  sqlite:")) {
  $content = str_replace("  simple_oauth: 0\n", "  simple_oauth: 0\n  sqlite: 0\n", $content);
  file_put_contents($path, $content);
}
'

echo "==> configuring the SQLite database"
cat >> web/sites/default/settings.php <<PHP

// Sync-only override, written fresh each run — never committed.
\$databases['default']['default'] = [
  'driver' => 'sqlite',
  'database' => '$DB_FILE',
];
PHP

echo "==> drush tome:install"
rm -f "$DB_FILE"
vendor/bin/drush tome:install -y
vendor/bin/drush php-eval 'node_access_rebuild();'
vendor/bin/drush cache:rebuild

echo "==> starting the PHP built-in server"
# Must run with cwd == docroot: Drupal composes some contrib module paths
# (e.g. jsonapi_hypermedia) relative to the working directory, which only
# resolves correctly when it matches the docroot under the built-in server.
(cd web && exec php -S "$WEBSERVER_HOST:$WEBSERVER_PORT" -t . .ht.router.php) > /tmp/php-server.log 2>&1 &
PHP_PID=$!
trap 'kill "$PHP_PID" 2>/dev/null || true' EXIT

ready=0
for _ in $(seq 1 20); do
  if curl -sf "http://$WEBSERVER_HOST:$WEBSERVER_PORT/" -o /dev/null; then
    ready=1
    break
  fi
  sleep 1
done
if [ "$ready" -ne 1 ]; then
  echo "PHP server did not become ready:" >&2
  cat /tmp/php-server.log >&2
  exit 1
fi

echo "==> running content sync"
node scripts/sync-content.mjs \
  --base-url="http://$WEBSERVER_HOST:$WEBSERVER_PORT" \
  --files-dir="$(pwd)/files/public"
