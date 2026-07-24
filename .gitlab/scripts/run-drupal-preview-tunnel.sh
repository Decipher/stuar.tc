#!/usr/bin/env bash
# Assembles + provisions a local Drupal instance via drupal/.devtools/ (PHP +
# SQLite, no Docker/DDEV) and keeps it running behind a Cloudflare tunnel
# (on by default — see drupal/scripts/start-cloudflared.sh) for manual
# testing against real Drupal admin/JSON:API, mirroring run-live-preview-tunnel.sh
# for the frontend.
set -uo pipefail

cd "$(dirname "$0")/../.."

marker="<!-- preview-backend-comment -->"
cleanup_channel=""

cleanup() {
  if [ "$cleanup_channel" = "mr" ]; then
    echo "Cleaning up preview comment..."
    bash .gitlab/scripts/delete-mr-note.sh "$marker" || true
  fi
  (cd drupal && ./.devtools/stop) || true
}
trap cleanup EXIT
trap 'cleanup; exit' TERM INT

keep_alive_minutes="${PREVIEW_KEEP_ALIVE_MINUTES:-55}"

cd drupal
./.devtools/assemble
./.devtools/provision
./.devtools/start

site_url="$(grep -m1 '^TUNNEL_URL=' .env 2>/dev/null | cut -d= -f2-)"
if [ -z "$site_url" ]; then
  webserver_port="$(grep -m1 '^WEBSERVER_PORT=' .env 2>/dev/null | cut -d= -f2-)"
  site_url="http://127.0.0.1:${webserver_port:-8888}"
  echo "No Cloudflare tunnel URL found — cloudflared may not be available on this runner; falling back to the local URL (only reachable from inside the job)."
fi

login_link="$(vendor/bin/drush -l "$site_url" uli --no-browser 2>/dev/null || true)"

echo "Backend tunnel: $site_url"
echo "Login link: ${login_link:-(unavailable)}"

cd ..
cleanup_channel="$(bash .gitlab/scripts/post-drupal-preview-urls.sh "$site_url" "$login_link")"

echo "Keeping the backend alive for ${keep_alive_minutes} minutes..."
end_time=$(( $(date +%s) + keep_alive_minutes * 60 ))
while [ "$(date +%s)" -lt "$end_time" ]; do
  sleep 60
  status="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$site_url" || echo "unreachable")"
  echo "[heartbeat] $(date -u +%H:%M:%S) backend reachability: $status"
done
