#!/usr/bin/env bash
# Post-provision hook (see .devtools/README.md): sets up Simple OAuth
# (RSA keypair + config), a dedicated `story-sync` Drupal user/role, and a
# Consumer entity for the client_credentials grant used by
# nuxt/scripts/push-story.mjs to push authored articles into Drupal via
# JSON:API.
#
# Only runs the OAuth/user/Consumer setup — it does not run push-story.mjs
# itself. Opt in by setting PROVISION_SIMPLE_OAUTH=1 (skipped by default so
# a plain `.devtools/provision` for content-sync work doesn't pay for a
# setup step it doesn't need).
set -euo pipefail

if [ "${PROVISION_SIMPLE_OAUTH:-}" != "1" ]; then
  exit 0
fi

OAUTH_PRIVATE_KEY="${OAUTH_PRIVATE_KEY:-/tmp/stuartclark-oauth-private.key}"
OAUTH_PUBLIC_KEY="${OAUTH_PUBLIC_KEY:-/tmp/stuartclark-oauth-public.key}"
CLIENT_SECRET="${STORY_SYNC_CLIENT_SECRET:-local-push-story-secret}"

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

  $role = \Drupal\user\Entity\Role::create([
    "id" => "story_sync",
    "label" => "Story Sync",
  ]);
  $role->grantPermission("bypass node access");
  $role->grantPermission("administer nodes");
  $role->grantPermission("administer taxonomy");
  $role->grantPermission("administer media");
  $role->grantPermission("create media");
  $role->grantPermission("create image media");
  $role->grantPermission("update media");
  $role->grantPermission("update any media");
  $role->grantPermission("access druxt resources");
  $role->grantPermission("use text format formatted");
  $role->grantPermission("use text format plain_text");
  $role->grantPermission("edit behavior plugin settings");
  $role->grantPermission("add linky entities");
  $role->grantPermission("view linky entities");
  foreach (["section", "text_formatted", "code", "repository", "media", "card", "card_group", "jumbotron", "link"] as $bundle) {
    $role->grantPermission("create paragraph content $bundle");
    $role->grantPermission("update paragraph content $bundle");
  }
  $role->save();

  $user->addRole("story_sync");
  $user->save();
}

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
$consumer->set("grant_types", "client_credentials");
$consumer->save();

// Simple OAuth 6.x requires a scope entity for the client_credentials grant.
$scope_storage = \Drupal::entityTypeManager()->getStorage("oauth2_scope");
$scope = $scope_storage->load("story_sync");
if (!$scope) {
  $scope = \Drupal\simple_oauth\Entity\Oauth2Scope::create([
    "name" => "story_sync",
    "description" => "Push articles via JSON:API",
    "umbrella" => FALSE,
    "grant_types" => [
      "client_credentials" => [
        "status" => TRUE,
        "description" => "Push articles",
      ],
    ],
    "granularity_id" => "role",
    "granularity_configuration" => ["role" => "story_sync"],
  ]);
  $scope->save();
}

// Set the client_id field to the UUID (Simple OAuth 6.x authenticates by this
// field, not the entity UUID).
$consumer->set("client_id", $consumer->uuid());
$consumer->save();

print $consumer->uuid();
' > /tmp/stuartclark-client-id.txt

echo "==> client_id: $(cat /tmp/stuartclark-client-id.txt)"
