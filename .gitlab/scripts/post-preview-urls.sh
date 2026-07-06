#!/usr/bin/env bash
# Dispatches live-preview tunnel URLs to the appropriate notification channels:
#   - Discord webhook: always (when $DISCORD_WEBHOOK_URL is set)
#   - MR note:         when running under a merge-request pipeline
#   - Commit comment:  when running under a branch pipeline (no MR)
#
# Usage: post-preview-urls.sh <nuxt_url> <storybook_url>
#
# Prints a single token (stdout) naming the deletable GitLab surface used
# ("mr" or "commit") so the caller knows what to clean up; "" if none. Discord
# messages are left in place (they state their own expiry). Never exits non-zero
# — a failing channel is logged to stderr but does not interrupt the preview.
set -uo pipefail

cd "$(dirname "$0")/../.." || exit 1

nuxt_url="${1:-}"
storybook_url="${2:-}"

if [ -z "$nuxt_url" ] && [ -z "$storybook_url" ]; then
  echo "No tunnel URLs captured — nothing to notify." >&2
  exit 0
fi

cleanup_channel=""

# 1. Discord — always (no-op when $DISCORD_WEBHOOK_URL is unset).
bash .gitlab/scripts/post-discord-notification.sh "$nuxt_url" "$storybook_url" >&2 \
  || echo "Discord notification failed." >&2

# 2. GitLab-native surface: MR note for MR pipelines, commit comment otherwise.
if [ -n "${CI_MERGE_REQUEST_IID:-}" ]; then
  if bash .gitlab/scripts/post-live-preview-comment.sh "$nuxt_url" "$storybook_url" >&2; then
    cleanup_channel="mr"
  fi
else
  if bash .gitlab/scripts/post-commit-comment.sh "$nuxt_url" "$storybook_url" >&2; then
    cleanup_channel="commit"
  fi
fi

echo "$cleanup_channel"
