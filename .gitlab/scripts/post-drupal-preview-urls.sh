#!/usr/bin/env bash
# Dispatches the Drupal backend preview's tunnel URL + login link to the
# same notification channels run-live-preview-tunnel.sh uses for the
# frontend (Discord, MR note, or commit comment) — see post-preview-urls.sh.
#
# Usage: post-drupal-preview-urls.sh <site_url> <login_link>
#
# Prints a single token (stdout) naming the deletable GitLab surface used
# ("mr" or "commit") so the caller knows what to clean up; "" if none. Never
# exits non-zero — a failing channel is logged to stderr but does not
# interrupt the preview.
set -uo pipefail

cd "$(dirname "$0")/../.." || exit 1

site_url="${1:-}"
login_link="${2:-}"

if [ -z "$site_url" ]; then
  echo "No backend tunnel URL captured — nothing to notify." >&2
  exit 0
fi

cleanup_channel=""

# 1. Discord — always (no-op when $DISCORD_WEBHOOK_URL is unset).
bash .gitlab/scripts/post-discord-drupal-notification.sh "$site_url" "$login_link" >&2 \
  || echo "Discord notification failed." >&2

# 2. GitLab-native surface: MR note for MR pipelines, commit comment otherwise.
if [ -n "${CI_MERGE_REQUEST_IID:-}" ]; then
  if bash .gitlab/scripts/post-drupal-preview-comment.sh "$site_url" "$login_link" >&2; then
    cleanup_channel="mr"
  fi
else
  if bash .gitlab/scripts/post-drupal-commit-comment.sh "$site_url" "$login_link" >&2; then
    cleanup_channel="commit"
  fi
fi

echo "$cleanup_channel"
