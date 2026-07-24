#!/usr/bin/env bash
# Usage: post-drupal-preview-comment.sh <site_url> <login_link>
set -euo pipefail

cd "$(dirname "$0")/../.."

site_url="${1:-}"
login_link="${2:-}"
marker="<!-- preview-backend-comment -->"
body_file=$(mktemp)
{
  echo "$marker"
  echo "### Backend preview"
  echo
  [ -n "$site_url" ] && echo "- **Site:** $site_url"
  [ -n "$login_link" ] && echo "- **Login:** $login_link"
  echo
  echo "_Open for up to ${PREVIEW_KEEP_ALIVE_MINUTES:-55} minutes, or until [the preview job]($CI_JOB_URL) is cancelled._"
} > "$body_file"

bash .gitlab/scripts/upsert-mr-note.sh "$marker" "$body_file"
