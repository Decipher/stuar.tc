#!/usr/bin/env bash
# Posts the backend preview's tunnel URL + login link to a Discord channel
# via a webhook. Usage: post-discord-drupal-notification.sh <site_url> <login_link>
#
# Requires $DISCORD_WEBHOOK_URL (masked CI/CD variable, project or group level).
# No-ops silently when unset so the preview job is unaffected if Discord is not
# configured. The message is left in place after the preview ends — it states
# its own expiry window.
set -uo pipefail

site_url="${1:-}"
login_link="${2:-}"

if [ -z "${DISCORD_WEBHOOK_URL:-}" ]; then
  echo "DISCORD_WEBHOOK_URL not set — skipping Discord notification."
  exit 0
fi

# shellcheck disable=SC2016 # node script is intentionally single-quoted; values are passed via argv, not shell expansion.
payload=$(node -e '
const [siteUrl, loginLink, jobUrl, refName, shortSha, keepAlive] = process.argv.slice(1);
const fields = [];
if (siteUrl) fields.push({ name: "Site", value: siteUrl });
if (loginLink) fields.push({ name: "Login", value: loginLink });
if (keepAlive) fields.push({
  name: "Expires",
  value: `Open for up to ${keepAlive} minutes, or until the job is cancelled.`,
});
const embed = {
  title: "Backend preview ready",
  description: jobUrl ? `Open the [preview job](${jobUrl}) in GitLab CI.` : "Backend preview is running.",
  color: 12720756,
  timestamp: new Date().toISOString(),
};
if (fields.length) embed.fields = fields;
if (refName || shortSha) embed.footer = { text: [refName, shortSha].filter(Boolean).join(" @ ") };
process.stdout.write(JSON.stringify({ embeds: [embed] }));
' "$site_url" "$login_link" "${CI_JOB_URL:-}" "${CI_COMMIT_REF_NAME:-}" "${CI_COMMIT_SHORT_SHA:-}" "${PREVIEW_KEEP_ALIVE_MINUTES:-55}")

http_code=$(curl -s -o /dev/null -w '%{http_code}' --retry 3 --retry-delay 2 --max-time 30 \
  -H 'Content-Type: application/json' \
  -d "$payload" \
  "$DISCORD_WEBHOOK_URL")

echo "Discord webhook responded HTTP ${http_code}."
