#!/usr/bin/env bash

# Set up ddev for use on gitpod
DRUPAL_DIR="${GITPOD_REPO_ROOT}/drupal"

# Download ddev's images
cd $DRUPAL_DIR && ddev debug download-images

# Misc housekeeping before start
cd $DRUPAL_DIR && ddev config global --instrumentation-opt-in=true

# Start ddev
cd $DRUPAL_DIR && ddev start -y
