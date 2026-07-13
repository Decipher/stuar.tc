#!/usr/bin/env bash
# Posts the live-preview tunnel URLs as a comment on the current commit.
# GitLab-native fallback for branch pipelines that have no merge request.
# Usage: post-commit-comment.sh <nuxt_url> <storybook_url>
#
# Requires $GITLAB_API_TOKEN (same token as the MR-note scripts). The comment
# states its own expiry window and is left in place after the preview ends.
set -euo pipefail

nuxt_url="${1:-}"
storybook_url="${2:-}"

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
  echo "### Live preview"
  echo
  [ -n "$nuxt_url" ] && echo "- **Site:** $nuxt_url"
  [ -n "$storybook_url" ] && echo "- **Storybook:** $storybook_url"
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
