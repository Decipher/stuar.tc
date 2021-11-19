#!/usr/bin/env bash
set -eu -o pipefail

DRUPAL_DIR="${GITPOD_REPO_ROOT}/drupal"

# Set up Drupal website
cd "$DRUPAL_DIR" && ddev composer install
cd "$DRUPAL_DIR" && ddev drush -y tome:install
cd "$DRUPAL_DIR" && ddev drush php-eval 'node_access_rebuild\(\);'
