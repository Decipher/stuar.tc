#!/usr/bin/env bash
# Uploads failed visual-test screenshots (actual + expected + diff) as an MR note.
# One sticky comment per CI job (keyed by $CI_JOB_NAME) so the visual and seo
# jobs don't overwrite each other. Run as the visual job's after_script.
set -uo pipefail

cd "$(dirname "$0")/../.."

job="${CI_JOB_NAME:-visual}"
results_dir="nuxt/test-results"

if [ ! -d "$results_dir" ]; then
  echo "No $results_dir directory — nothing to report."
  exit 0
fi

mapfile -t actuals < <(find "$results_dir" -name "*-actual.png" -type f | sort)

if [ ${#actuals[@]} -eq 0 ]; then
  echo "No visual test failure screenshots found."
  # Remove any stale failure comment from a previous run of this job.
  bash .gitlab/scripts/delete-mr-note.sh "<!-- visual-failure:${job} -->" 2>/dev/null || true
  exit 0
fi

curl_retry=(curl -s --retry 3 --retry-delay 2 --max-time 30 --header "PRIVATE-TOKEN: $GITLAB_API_TOKEN")
# stuar.tc project id is 2; $CI_PROJECT_ID is always set in CI.
upload_url="${CI_API_V4_URL:-http://gitlab.local/api/v4}/projects/${CI_PROJECT_ID:-2}/uploads"

upload() {
  "${curl_retry[@]}" --request POST --form "file=@$1" "$upload_url" \
    | node -e "
let body = '';
try { body = JSON.parse(require('fs').readFileSync(0,'utf8')).markdown || ''; } catch {}
process.stdout.write(body);
"
}

marker="<!-- visual-failure:${job} -->"
body_file=$(mktemp)
{
  echo "$marker"
  echo "### Visual failures · \`${job}\` @ \`${CI_COMMIT_SHORT_SHA:-unknown}\`"
  echo
  for actual in "${actuals[@]}"; do
    dir=$(dirname "$actual")
    label=$(basename "$dir" | sed 's/-retry[0-9]*$//')

    expected="${actual%-actual.png}-expected.png"
    diff_file="${actual%-actual.png}-diff.png"

    expected_md=""
    [ -f "$expected" ] && expected_md=$(upload "$expected")
    actual_md=$(upload "$actual")
    diff_md=""
    [ -f "$diff_file" ] && diff_md=$(upload "$diff_file")

    echo "#### \`${label}\`"
    echo
    echo "| Expected (baseline) | Actual (render) | Diff |"
    echo "| --- | --- | --- |"
    echo "| ${expected_md:-missing} | ${actual_md:-missing} | ${diff_md:-missing} |"
    echo
  done
  echo "_To accept: update baselines via the manual \`visual:update\` CI job (x86_64) and commit the PNGs._"
} > "$body_file"

bash .gitlab/scripts/upsert-mr-note.sh "$marker" "$body_file"
rm -f "$body_file"
