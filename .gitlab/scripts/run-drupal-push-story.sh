#!/usr/bin/env bash
# Sets up a local Drupal instance (PHP + SQLite, no DDEV) with Simple OAuth,
# runs push-story.mjs to push an article into Drupal via JSON:API, then
# exports the new content via `drush tome:content-export`.
#
# Usage:
#   .gitlab/scripts/run-drupal-push-story.sh
#
# Environment:
#   PUSH_FILE       Path to the article JSON (default: field-tokens article)
#   WEBSERVER_HOST  PHP server host (default: 127.0.0.1)
#   WEBSERVER_PORT  PHP server port (default: 8888)
set -euo pipefail

cd "$(dirname "$0")/../.."
cd drupal

WEBSERVER_HOST="${WEBSERVER_HOST:-127.0.0.1}"
WEBSERVER_PORT="${WEBSERVER_PORT:-8888}"
DB_FILE="${DB_FILE:-/tmp/stuartclark-push.sqlite}"
PUSH_FILE="${PUSH_FILE:-../nuxt/content/articles-data/field-tokens-200-20260722.json}"
OAUTH_PRIVATE_KEY="${OAUTH_PRIVATE_KEY:-/tmp/stuartclark-oauth-private.key}"
OAUTH_PUBLIC_KEY="${OAUTH_PUBLIC_KEY:-/tmp/stuartclark-oauth-public.key}"
CLIENT_SECRET="local-push-story-secret"

echo "==> composer install"
composer install --no-interaction --no-progress

echo "==> enabling the sqlite module in this checkout only (never committed)"
php -r '
$path = "config/sync/core.extension.yml";
$content = file_get_contents($path);
if (!str_contains($content, "  sqlite:")) {
  $content = str_replace("  simple_oauth: 0\n", "  simple_oauth: 0\n  sqlite: 0\n", $content);
  file_put_contents($path, $content);
}
'

echo "==> configuring the SQLite database"
cat >> web/sites/default/settings.php <<PHP

// Push-only override, written fresh each run — never committed.
\$databases['default']['default'] = [
  'driver' => 'sqlite',
  'database' => '$DB_FILE',
];
PHP

echo "==> drush tome:install"
rm -f "$DB_FILE"
vendor/bin/drush tome:install -y
vendor/bin/drush php-eval 'node_access_rebuild();'
vendor/bin/drush cache:rebuild

echo "==> generating Simple OAuth keys"
openssl genrsa -out "$OAUTH_PRIVATE_KEY" 2048 2>/dev/null
openssl rsa -in "$OAUTH_PRIVATE_KEY" -pubout -out "$OAUTH_PUBLIC_KEY" 2>/dev/null
chmod 600 "$OAUTH_PRIVATE_KEY"

echo "==> configuring Simple OAuth"
vendor/bin/drush php-eval '
$config = \Drupal::configFactory()->getEditable("simple_oauth.settings");
$config->set("private_key", "'"$OAUTH_PRIVATE_KEY"'");
$config->set("public_key", "'"$OAUTH_PUBLIC_KEY"'");
$config->set("access_token_expiration", 3600);
$config->save();
'

echo "==> creating story-sync user + role + Consumer"
# Create the story-sync user if it doesn't exist.
vendor/bin/drush php-eval '
$user = user_load_by_name("story-sync");
if (!$user) {
  $user = \Drupal\user\Entity\User::create([
    "name" => "story-sync",
    "mail" => "story-sync@example.com",
    "pass" => "local-only",
    "status" => 1,
  ]);
  $user->save();

  // Create a role with the permissions needed for JSON:API writes.
  $role = \Drupal\user\Entity\Role::create([
    "id" => "story_sync",
    "label" => "Story Sync",
  ]);
  // Node access
  $role->grantPermission("bypass node access");
  $role->grantPermission("administer nodes");
  // Taxonomy
  $role->grantPermission("administer taxonomy");
  // Druxt/JSON:API
  $role->grantPermission("access druxt resources");
  // Text formats
  $role->grantPermission("use text format formatted");
  $role->grantPermission("use text format plain_text");
  // Layout Paragraphs behavior settings
  $role->grantPermission("edit behavior plugin settings");
  // Per-bundle paragraph create/update permissions
  foreach (["section", "text_formatted", "code", "repository", "media", "card", "card_group", "jumbotron", "link"] as $bundle) {
    $role->grantPermission("create paragraph content $bundle");
    $role->grantPermission("update paragraph content $bundle");
  }
  $role->save();

  $user->addRole("story_sync");
  $user->save();
}

// Create or update the Story Sync Consumer for client_credentials grant.
// The Consumer UUID is the OAuth client_id; its secret is the client_secret.
// The roles field grants the story_sync role to the OAuth token.
$storage = \Drupal::entityTypeManager()->getStorage("consumer");
$consumers = $storage->loadByProperties(["label" => "Story Sync"]);
$consumer = reset($consumers);
if (!$consumer) {
  $consumer = $storage->create([
    "label" => "Story Sync",
    "owner_id" => $user->id(),
    "user_id" => $user->id(),
    "confidential" => TRUE,
    "is_default" => FALSE,
    "pkce" => FALSE,
    "third_party" => FALSE,
  ]);
}
$consumer->set("secret", "'"$CLIENT_SECRET"'");
$consumer->set("confidential", TRUE);
$consumer->set("user_id", ["target_id" => $user->id()]);
$consumer->set("roles", ["target_id" => "story_sync"]);
$consumer->save();

// Output the client_id (the Consumer UUID) for the push script.
print $consumer->uuid();
' > /tmp/stuartclark-client-id.txt

CLIENT_ID=$(cat /tmp/stuartclark-client-id.txt)
echo "==> client_id: $CLIENT_ID"

echo "==> starting the PHP built-in server"
(cd web && exec php -S "$WEBSERVER_HOST:$WEBSERVER_PORT" -t . .ht.router.php) > /tmp/php-server.log 2>&1 &
PHP_PID=$!
trap 'kill "$PHP_PID" 2>/dev/null || true' EXIT

ready=0
for _ in $(seq 1 20); do
  if curl -sf "http://$WEBSERVER_HOST:$WEBSERVER_PORT/" -o /dev/null; then
    ready=1
    break
  fi
  sleep 1
done
if [ "$ready" -ne 1 ]; then
  echo "PHP server did not become ready:" >&2
  cat /tmp/php-server.log >&2
  exit 1
fi

echo "==> installing druxt (patched) in nuxt/"
if ! command -v pnpm &>/dev/null; then
  corepack enable
  corepack prepare pnpm@10 --activate
fi
pnpm --dir ../nuxt install --frozen-lockfile

echo "==> running push-story.mjs"
node ../nuxt/scripts/push-story.mjs \
  --base-url="http://$WEBSERVER_HOST:$WEBSERVER_PORT" \
  --file="$PUSH_FILE" \
  --client-id="$CLIENT_ID" \
  --client-secret="$CLIENT_SECRET"

echo "==> exporting content via tome:content-export"
vendor/bin/drush tome:content-export -y

echo "==> done — new Tome export files are in drupal/content/"
