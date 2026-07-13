#!/usr/bin/env bash
# Posts the live-preview tunnel URLs to a Discord channel via a webhook.
# Usage: post-discord-notification.sh <nuxt_url> <storybook_url>
#
# Requires $DISCORD_WEBHOOK_URL (masked CI/CD variable, project or group level).
# No-ops silently when unset so the preview job is unaffected if Discord is not
# configured. The message is left in place after the preview ends — it states
# its own expiry window.
set -uo pipefail

nuxt_url="${1:-}"
storybook_url="${2:-}"

if [ -z "${DISCORD_WEBHOOK_URL:-}" ]; then
  echo "DISCORD_WEBHOOK_URL not set — skipping Discord notification."
  exit 0
fi

# Build the webhook payload with node so URLs are JSON-escaped safely (node is
# present in every job image this project uses). Brand magenta #c21a74.
# shellcheck disable=SC2016 # node script is intentionally single-quoted; values are passed via argv, not shell expansion.
payload=$(node -e '
const [nuxtUrl, storybookUrl, jobUrl, refName, shortSha, keepAlive] = process.argv.slice(1);
const fields = [];
if (nuxtUrl) fields.push({ name: "Site", value: nuxtUrl });
if (storybookUrl) fields.push({ name: "Storybook", value: storybookUrl });
if (keepAlive) fields.push({
  name: "Expires",
  value: `Open for up to ${keepAlive} minutes, or until the job is cancelled.`,
});
const embed = {
  title: "Live preview ready",
  description: jobUrl ? `Open the [preview job](${jobUrl}) in GitLab CI.` : "Live preview is running.",
  color: 12720756,
  timestamp: new Date().toISOString(),
};
if (fields.length) embed.fields = fields;
if (refName || shortSha) embed.footer = { text: [refName, shortSha].filter(Boolean).join(" @ ") };
process.stdout.write(JSON.stringify({ embeds: [embed] }));
' "$nuxt_url" "$storybook_url" "${CI_JOB_URL:-}" "${CI_COMMIT_REF_NAME:-}" "${CI_COMMIT_SHORT_SHA:-}" "${PREVIEW_KEEP_ALIVE_MINUTES:-55}")

http_code=$(curl -s -o /dev/null -w '%{http_code}' --retry 3 --retry-delay 2 --max-time 30 \
  -H 'Content-Type: application/json' \
  -d "$payload" \
  "$DISCORD_WEBHOOK_URL")

echo "Discord webhook responded HTTP ${http_code}."
