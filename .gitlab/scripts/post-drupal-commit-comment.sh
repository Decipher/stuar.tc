#!/usr/bin/env bash
# Posts the backend preview's tunnel URL + login link as a comment on the
# current commit. GitLab-native fallback for branch pipelines with no MR.
# Usage: post-drupal-commit-comment.sh <site_url> <login_link>
#
# Requires $GITLAB_API_TOKEN (same token as the MR-note scripts). The comment
# states its own expiry window and is left in place after the preview ends.
set -euo pipefail

site_url="${1:-}"
login_link="${2:-}"

if [ -z "${CI_COMMIT_SHA:-}" ]; then
  echo "CI_COMMIT_SHA not set — cannot post commit comment."
  exit 1
fi

if [ -z "${GITLAB_API_TOKEN:-}" ]; then
  echo "GITLAB_API_TOKEN not set — skipping commit comment."
  exit 1
fi

api_base="${CI_API_V4_URL:-http://gitlab.local/api/v4}"
url="${api_base}/projects/${CI_PROJECT_ID:-2}/repository/commits/${CI_COMMIT_SHA}/comments"

body=$(mktemp)
{
  echo "### Backend preview"
  echo
  [ -n "$site_url" ] && echo "- **Site:** $site_url"
  [ -n "$login_link" ] && echo "- **Login:** $login_link"
  echo
  echo "_Open for up to ${PREVIEW_KEEP_ALIVE_MINUTES:-55} minutes, or until [the preview job](${CI_JOB_URL:-}) is cancelled._"
} > "$body"

curl -s --retry 3 --retry-delay 2 --max-time 30 \
  --header "PRIVATE-TOKEN: ${GITLAB_API_TOKEN}" \
  --request POST \
  --form "note=<${body}" \
  "$url" >/dev/null

rm -f "$body"
echo "Commit comment posted to ${CI_COMMIT_SHORT_SHA:-$CI_COMMIT_SHA}."
