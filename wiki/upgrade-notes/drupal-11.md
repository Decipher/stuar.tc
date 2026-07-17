# Drupal 11 Upgrade Notes

## Overview

This document covers upgrading from Drupal 10.4.x to Drupal 11.x.

## Prerequisites

- [ ] Current site is on Drupal 10.4.x
- [ ] All contrib modules have D11-compatible versions
- [ ] PHP 8.3+ is available (required for D11)
- [ ] Upgraded to Drupal 10.4 first

## Pre-Upgrade Steps

### 1. PHP Version Check

Drupal 11 requires PHP 8.3:

```bash
php -v
# Should show 8.3.x
```

### 2. Update All Modules to Latest

Ensure all contrib modules are updated to versions supporting D11:

```bash
ddev drush pm:security
composer outdated
```

### 3. Remove Deprecated Modules

D11 removes several deprecated modules:
- Check for any deprecated modules in current setup
- Replace with recommended alternatives

## Upgrade Steps

### 1. Update Composer for D11

```bash
# Update to D11
composer require drupal/core-recommended:^11 drupal/core-composer-scaffold:^11 drupal/core-project-message:^11 --no-update

# Update all dependencies
composer update --with-all-dependencies -W
```

### 2. Remove Old Core Packages (if any)

```bash
composer remove drupal/core-dev --dev --no-update
composer require drupal/core-dev:^11 --dev --no-update
```

### 3. Run Updates

```bash
ddev drush updb
ddev drush cr
```

### 4. Verify Configuration

```bash
ddev drush cim
```

## Breaking Changes in D11

### PHP 8.3 Required

- All code must be PHP 8.3 compatible
- Deprecated PHP features removed

### Symfony 7.x

D11 uses Symfony 7.x which has breaking changes:
- Some service definitions may need updates
- Controller signatures may have changed

### Removed Modules

The following modules are removed in D11:
- `ban` (moved to core)
- `book` (moved to core)

### JavaScript

- jQuery removed from admin theme
- Use vanilla JS or modern frameworks

## Post-Upgrade Verification

- [ ] Site loads without errors
- [ ] Admin interface works
- [ ] All content types functional
- [ ] JSON:API endpoints respond
- [ ] Custom modules work correctly
- [ ] No deprecation warnings in logs

## Known Compatibility Issues

### Theme Compatibility

The Gin theme needs to be updated to 4.x for D11:
```bash
composer require drupal/gin:^4.0 drupal/gin_login:^2.0 drupal/gin_toolbar:^2.0
```

## Notes

The frontend (`apps/stuar.tc/nuxt`) never talks to this Drupal instance at
build or runtime (see [Architecture](../architecture.md)), so Druxt module
compatibility is **not** a blocker for this D11 upgrade itself — only the
backend's own JSON:API surface (tested via
`drupal/web/modules/custom/stuartc_tests/`) and admin/content-editing
functionality need verification.

### Druxt re-integration (landed — see Content Sync in Architecture)

This was originally tracked here as future, post-launch work. It landed as
a CI-time content sync rather than a runtime/build-time integration:
Druxt's Nuxt 2 module ecosystem (`druxt-site`, `druxt-entity`,
`druxt-layout-paragraphs`, `@druxt-contrib/config-pages`) still has no
Nuxt 3/4 support (the published `druxt` npm package remains Vue 2/Vuex-locked;
upstream `druxt/druxt.js` has stalled partial Nuxt 3 branches —
`feature/337-nuxt3`, `feature/693-nuxt_kit` — tracked by open issues #337
and #693), so rather than wait or fork, a small bespoke JSON:API client
(`drupal/scripts/sync-content.mjs`) was built for this site's own 5
paragraph bundle types. It only runs inside the manual GitLab CI sync job,
against a DDEV instance the job itself spins up — never against a hosted
Drupal, since none exists. See
[Content Sync](../architecture.md#content-sync-drupal--nuxt) for the full
data flow. A general-purpose Druxt-for-Nuxt-4 framework remains separate,
upstream work on `druxt/druxt.js`, not something this site depends on.
