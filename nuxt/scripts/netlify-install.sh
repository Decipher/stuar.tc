#!/usr/bin/env bash
set -euo pipefail

# Netlify only checks out this repo — @stuartclark/ui is consumed as
# "link:../../ui" (a workspace-style sibling dependency), which only resolves
# in environments that set up that sibling directory themselves.  Do the same
# thing here: clone the ui mirror two levels up, build it, then install this
# repo's own dependencies.
#
# Set "Install command" in Netlify → Site configuration → Build & deploy →
# Build settings to: bash scripts/netlify-install.sh
#
# Requires a Netlify Environment Variable named UI_REPO_TOKEN with read access
# to the private Decipher/sc-ui repo (Site configuration -> Environment
# variables).

if [[ -z "${UI_REPO_TOKEN:-}" ]]; then
  echo "UI_REPO_TOKEN is not set — cannot clone Decipher/sc-ui." >&2
  exit 1
fi

# Defensive: strip surrounding quotes/whitespace some UIs add on paste. A stray
# character here broke git's URL parsing in confusing ways (e.g. "Port number
# was not a decimal number") when the token was embedded directly in the URL.
TOKEN=$(printf '%s' "$UI_REPO_TOKEN" | tr -d '\r\n' | sed -e 's/^[[:space:]"'"'"']*//' -e 's/[[:space:]"'"'"']*$//')

# Safe (non-leaking) diagnostics: length and character-class only, never the
# value itself, so a mis-pasted token is visible in build logs without
# exposing the real secret.
echo "UI_REPO_TOKEN: raw length ${#UI_REPO_TOKEN}, sanitized length ${#TOKEN}"
if [[ "$TOKEN" =~ [^a-zA-Z0-9_-] ]]; then
  echo "WARNING: sanitized token contains characters outside [a-zA-Z0-9_-] — likely still mis-pasted." >&2
fi

# Build runs from nuxt/ (base dir), so ../../ui lands outside the repo checkout
# at the same level as the working tree — exactly where link:../../ui resolves.
rm -rf ../../ui
git clone "https://x-access-token:${TOKEN}@github.com/Decipher/sc-ui.git" ../../ui -b main
corepack enable
(cd ../../ui && pnpm install --frozen-lockfile && pnpm prepare)

pnpm install --frozen-lockfile
