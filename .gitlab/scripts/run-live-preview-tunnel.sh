#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

marker="<!-- preview-live-comment -->"
comment_posted=false

cleanup() {
  [ -n "${storybook_pid:-}" ] && kill "$storybook_pid" 2>/dev/null || true
  if [ "$comment_posted" = true ] && [ -n "${CI_MERGE_REQUEST_IID:-}" ]; then
    echo "Cleaning up preview comment..."
    bash .gitlab/scripts/delete-mr-note.sh "$marker" || true
  fi
}
trap cleanup EXIT
trap 'cleanup; exit' TERM INT

keep_alive_minutes="${PREVIEW_KEEP_ALIVE_MINUTES:-55}"
log_file=$(mktemp)

# cloudflared self-updates and restarts mid-run by default, which kills the
# original tunnel (the URL we already captured and posted) and silently
# starts a brand new one under a different hostname.
export NO_AUTOUPDATE="${NO_AUTOUPDATE:-true}"
# untun silences cloudflared's own stdout/stderr unless DEBUG is set; keep it
# on so connectivity precheck/registration/update events stay visible.
export DEBUG="${DEBUG:-1}"

# Start Storybook dev server (:6006). The Nuxt cloudflared-tunnel module
# (storybook: true) opens a tunnel TO this port — it does not launch
# Storybook itself, so it must already be listening.
echo "Starting Storybook on :6006..."
pnpm --dir nuxt storybook > /dev/null 2>&1 &
storybook_pid=$!

# Start the Nuxt dev server. The tunnel module creates Quick Tunnels for
# both Nuxt (auto port) and Storybook (:6006, after a 5 s delay).
echo "Starting Nuxt dev server..."
timeout "${keep_alive_minutes}m" pnpm --dir nuxt dev 2>&1 | tee "$log_file" &
dev_pid=$!

# Wait for tunnel URLs to appear in the dev server output.
nuxt_url=""
storybook_url=""
for _ in $(seq 1 120); do
  [ -z "$nuxt_url" ] && nuxt_url=$(grep -m1 'Nuxt tunnel ready at:' "$log_file" | sed -E 's/.*ready at: *//' || true)
  [ -z "$storybook_url" ] && storybook_url=$(grep -m1 'Storybook tunnel ready at:' "$log_file" | sed -E 's/.*ready at: *//' || true)
  [ -n "$nuxt_url" ] && [ -n "$storybook_url" ] && break
  sleep 1
done

echo "Site tunnel: ${nuxt_url:-(not found)}"
echo "Storybook tunnel: ${storybook_url:-(not found)}"

if [ -n "${CI_MERGE_REQUEST_IID:-}" ] && { [ -n "$nuxt_url" ] || [ -n "$storybook_url" ]; }; then
  if bash .gitlab/scripts/post-live-preview-comment.sh "$nuxt_url" "$storybook_url"; then
    comment_posted=true
  else
    echo "Failed to post preview comment (tunnels are still up)"
  fi
fi

# Periodic reachability heartbeat.
if [ -n "$nuxt_url" ]; then
  (
    while kill -0 "$dev_pid" 2>/dev/null; do
      sleep 60
      status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$nuxt_url" || echo "unreachable")
      echo "[heartbeat] $(date -u +%H:%M:%S) site reachability: $status"
    done
  ) &
fi

wait "$dev_pid" || true
