#!/usr/bin/env bash

DRUPAL_DIR="${GITPOD_REPO_ROOT}/drupal"

echo "frontends: \"GitPod|https://3000-$GITPOD_WORKSPACE_ID.$GITPOD_WORKSPACE_CLUSTER_HOST/node/preview/[view_mode]#[jsonapi_node_preview]\"" > $DRUPAL_DIR/config/sync/druxt_node_preview.settings.yml
cd "$DRUPAL_DIR" && ddev drush cim -y
