#!/usr/bin/env bash
# Usage: post-live-preview-comment.sh <playground-url> <storybook-url>
set -euo pipefail

cd "$(dirname "$0")/../.."

nuxt_url="${1:-}"
storybook_url="${2:-}"
marker="<!-- preview-live-comment -->"
body_file=$(mktemp)
{
  echo "$marker"
  echo "### Live preview"
  echo
  [ -n "$nuxt_url" ] && echo "- **Site:** $nuxt_url"
  [ -n "$storybook_url" ] && echo "- **Storybook:** $storybook_url"
  echo
  echo "_Open for up to ${PREVIEW_KEEP_ALIVE_MINUTES:-55} minutes, or until [the preview job]($CI_JOB_URL) is cancelled._"
} > "$body_file"

bash .gitlab/scripts/upsert-mr-note.sh "$marker" "$body_file"
