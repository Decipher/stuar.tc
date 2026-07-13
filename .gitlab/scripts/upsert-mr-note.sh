#!/usr/bin/env bash
# Upserts a GitLab MR note identified by a hidden HTML-comment marker.
# Usage: upsert-mr-note.sh <marker> <body-file>
set -euo pipefail

marker="$1"
body_file="$2"
curl_retry=(curl -s --retry 3 --retry-delay 2 --max-time 30 --header "PRIVATE-TOKEN: $GITLAB_API_TOKEN")
notes_url="$CI_API_V4_URL/projects/$CI_PROJECT_ID/merge_requests/$CI_MERGE_REQUEST_IID/notes"

existing_id=$("${curl_retry[@]}" "$notes_url?per_page=100" \
  | node -e "
const fs = require('fs');
const marker = process.argv[1];
let notes = [];
try {
  const parsed = JSON.parse(fs.readFileSync(0, 'utf8'));
  if (Array.isArray(parsed)) notes = parsed;
} catch {}
const match = notes.find((n) => n.body && n.body.includes(marker));
process.stdout.write(match ? String(match.id) : '');
" "$marker")

if [ -n "$existing_id" ]; then
  "${curl_retry[@]}" --request PUT --form "body=<$body_file" "$notes_url/$existing_id"
else
  "${curl_retry[@]}" --request POST --form "body=<$body_file" "$notes_url"
fi
