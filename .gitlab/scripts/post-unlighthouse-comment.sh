#!/usr/bin/env bash
# Posts the unlighthouse per-metric budget report as a sticky MR note.
# One comment per pipeline (keyed by a hidden marker), updated in place on
# each push. Run as the audit:seo job's after_script so the report is posted
# whether the job passed or failed (the budget-gate script that fails the
# job runs earlier, in `script:`, and stops the job before reaching any
# report-writing step on failure — after_script always runs regardless).
set -uo pipefail

cd "$(dirname "$0")/../.."

marker="<!-- unlighthouse-report -->"

if [ ! -f "nuxt/.unlighthouse/ci-result.json" ]; then
  echo "No nuxt/.unlighthouse/ci-result.json — unlighthouse did not complete a scan."
  bash .gitlab/scripts/delete-mr-note.sh "$marker" 2>/dev/null || true
  exit 0
fi

body_file=$(mktemp)
node nuxt/scripts/audit-budgets.mjs nuxt/.unlighthouse --markdown "$body_file" >/dev/null 2>&1 || true

if [ ! -s "$body_file" ]; then
  echo "Budget script produced no markdown report — skipping comment."
  rm -f "$body_file"
  exit 0
fi

bash .gitlab/scripts/upsert-mr-note.sh "$marker" "$body_file"
rm -f "$body_file"
