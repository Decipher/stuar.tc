#!/usr/bin/env bash
##
# Start a Cloudflare quick tunnel exposing the local PHP dev server, and
# configure Drupal to trust it (see scripts/provision-cloudflared.sh).
#
# On by default. Opt out with CLOUDFLARE_TUNNEL=0 make start

set -eu

case "${CLOUDFLARE_TUNNEL:-1}" in
  0|false|no)
    # Drop any stale TUNNEL_URL so `make drush`/`make login` fall back to the
    # local webserver when the tunnel isn't in use.
    if [ -f .env ]; then
      sed -i '/^TUNNEL_URL=/d' .env
    fi
    exit 0
    ;;
esac

# Resolve the cloudflared binary: prefer plain PATH, then fall back to
# `mise which` — this sandbox (and possibly others) has `cloudflared`
# `mise install`ed (see ../.mise.toml) but no shell activation/shim hook
# putting it on PATH, so `command -v` alone misses it even though it's
# actually available.
CLOUDFLARED=""
if command -v cloudflared >/dev/null 2>&1; then
  CLOUDFLARED="cloudflared"
elif command -v mise >/dev/null 2>&1 && MISE_PATH="$(mise which cloudflared 2>/dev/null)" && [ -n "$MISE_PATH" ]; then
  CLOUDFLARED="$MISE_PATH"
fi

if [ -z "$CLOUDFLARED" ]; then
  echo "[cloudflared] Not found on PATH or via mise; skipping tunnel. Run 'mise install' (see ../.mise.toml)."
  exit 0
fi

mkdir -p .logs

WEBSERVER_PORT="${WEBSERVER_PORT:-$(grep -m1 '^WEBSERVER_PORT=' .env 2>/dev/null | cut -d= -f2-)}"
WEBSERVER_PORT="${WEBSERVER_PORT:-8888}"

PID_FILE=.logs/cloudflared.pid
LOG_FILE=.logs/cloudflared.log

extract_url() {
  grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$LOG_FILE" 2>/dev/null | head -n1
}

# Health-check an existing tunnel before reusing it. A running cloudflared
# process doesn't guarantee the tunnel is reachable — quick tunnels can
# silently die while the process stays alive (edge server drops the
# connection, network changes, etc.).
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  EXISTING_URL="$(extract_url)"
  if [ -n "$EXISTING_URL" ] && curl -s -o /dev/null -m 5 "$EXISTING_URL"; then
    echo "[cloudflared] Reusing healthy tunnel: ${EXISTING_URL}"
    exit 0
  fi
  echo "[cloudflared] Existing tunnel is unhealthy; restarting."
  kill "$(cat "$PID_FILE")" 2>/dev/null || true
  sleep 1
fi

echo "[cloudflared] Starting tunnel for http://localhost:${WEBSERVER_PORT} ..."
nohup "$CLOUDFLARED" tunnel --url "http://localhost:${WEBSERVER_PORT}" --no-autoupdate \
  >"$LOG_FILE" 2>&1 &
echo $! >"$PID_FILE"

for _ in $(seq 1 30); do
  [ -n "$(extract_url)" ] && break
  sleep 1
done

URL="$(extract_url)"
if [ -n "$URL" ]; then
  echo "[cloudflared] Public URL: ${URL}"

  # Persist for `make drush`/`make login` (see Makefile DRUSH_URI) and for
  # the Site URL printed by `.devtools/start` and `.devtools/provision`.
  if grep -q '^TUNNEL_URL=' .env 2>/dev/null; then
    sed -i "s|^TUNNEL_URL=.*|TUNNEL_URL=${URL}|" .env
  else
    echo "TUNNEL_URL=${URL}" >> .env
  fi
else
  echo "[cloudflared] Tunnel started but URL not yet available; check ${LOG_FILE}."
fi
