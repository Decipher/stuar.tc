# Drupal 11 Upgrade Notes

## Overview

Upgraded from **Drupal 9.4.5** directly to **Drupal 11.3.9** on May 12, 2026, using the [realityloop/foundry](https://github.com/realityloop/foundry) repo as the reference composer.json.

## What Changed

### Versions

- Drupal core: 9.4.5 → 11.3.9
- PHP: 8.1 → 8.3
- MariaDB: 10.3 → 10.6
- Drush: 11 → 13
- DDev type: drupal9 → drupal11

### Modules Updated (Major Bumps)

| Module | From | To |
|--------|------|----|
| admin_toolbar | 3.1.0 | ^3.6 |
| advanced_text_formatter | 2.1.1 | ^3.0@RC |
| allowed_formats | 1.5.0 | ^3.0.1 |
| coffee | 1.2.0 | ^2.0 |
| content_lock | 2.2.0 | ^3.0@alpha |
| diff | 1.0.0 | ^2.0@beta |
| dynamic_entity_reference | 2.0.0-alpha19 | ^4.0@alpha |
| entity_browser_enhanced | 1.0.0 | ^2.0 |
| entity_clone | 1.0.0-beta6 | ^2.1@beta |
| field_group | 3.2.0 | ^4.0 |
| focal_point | 1.5.0 | ^2.1 |
| gin | 3.x-dev | ^5.0 |
| gin_login | 1.x-dev | ^2.1 |
| gin_toolbar | 1.x-dev | ^3.0 |
| layout_paragraphs | 2.0.1 | ^3.0@alpha |
| linky | 1.0.0-beta1 | ^2.0@beta |
| m4032404 | 1.0.0-alpha5 | ^2.0 |
| masquerade | 2.0.0-beta4 | ^2.0 |
| maxlength | 2.0.0-rc1 | ^3.1 |
| metatag | 1.21.0 | ^2.2 |
| paragraphs_ee | 2.0.1 | 10.0.x-dev |
| schema_metatag | 2.3.0 | ^3.0 |
| security_review | 1.0.0-alpha2 | ^3.0 |
| simple_oauth | 5.2.0 | 6.0.x-dev |
| exclude_node_title | 1.4.0 | ^2.0 |
| prevent_homepage_deletion | 1.4.0 | ^3.0 |

### Modules Removed

| Module | Reason |
|--------|--------|
| title_field_for_manage_display | No D11 support, not in Foundry |
| admin_audit_trail + submodules | Not needed for decoupled site |
| transliterate_filenames | Max ^9 \|\| ^10, no D11 support |
| linky_revision_ui | Auto-disabled by linky update (max ^10) |

### Patches Updated

- Removed: drupal/core patches (fixed in D10+), entity_clone, dynamic_entity_reference, focal_point, metatag, layout_paragraphs
- Added from Foundry: drupal/druxt wildcard route translator + NULL ID fix, node_edit_protection additional patches
- Kept: gin, gin_toolbar, node_edit_protection patches (updated URLs to git merge requests)

### Custom Repos Added

```json
"drupal/druxt": {
    "type": "git",
    "url": "https://git.drupalcode.org/issue/druxt-3429976.git"
},
"drupal/entity_display_mode": {
    "type": "git",
    "url": "https://git.drupalcode.org/issue/entity_display_mode-3430161.git"
}
```

## Steps Taken

### 1. Prerequisites

- Archived `stuar-tc-upgrade-foundation` change
- Verified Jest suite passes (13 suites, 29 tests)
- Cypress skipped due to Node 24 / OpenSSL issue with Nuxt 2

### 2. Pre-Flight Audit

- Ran `composer outdated --direct` — identified 60+ outdated packages
- Ran `ddev drush pm:security` — 7 modules with security advisories
- Audited all contrib modules for D10/D11 compatibility
- Verified PHP 8.1 (needed upgrade to 8.3)

### 3. DDev Environment Updates

```bash
# Updated .ddev/config.yaml
# type: drupal9 → drupal11
# php_version: "8.1" → "8.3"
# mariadb_version: "10.3" → "10.6"

ddev config --database=mariadb:10.3  # revert for migration
ddev start
ddev utility migrate-database mariadb:10.6  # migrate data
```

### 4. Module Cleanup

```bash
ddev drush pm:uninstall title_field_for_manage_display -y
```

### 5. Composer Update

- Replaced composer.json with Foundry's D11 structure
- Added issue fork repos for druxt and entity_display_mode
- Removed incompatible packages (transliterate_filenames, linky_revision_ui)
- Ran `composer install` → Drupal 11.3.9 installed

### 6. Database Updates

```bash
ddev drush updb -y
```

**Errors encountered and fixed:**

- `jsonapi_menu_items_update_8001` — referenced removed ckeditor module. Fixed by manually setting schema version.
- Stale `ckeditor` and `color` schema entries. Removed from key_value storage.

### 7. Post-Update Fixes

```bash
ddev drush updb -y  # run again for post-updates
```

**Errors encountered and fixed:**

- `pathauto_post_update_remove_uuid_config_key` — pathauto patterns used `node_type` condition plugin (removed in D10+). Fixed by updating pattern config:

  ```php
  // Changed 'node_type' → 'entity_bundle:node' in selection_criteria
  ```

### 8. Config Import

```bash
ddev drush cim -y
```

**Config changes needed:**

- Removed `ckeditor`, `color` from `core.extension.yml`
- Removed `admin_audit_trail` submodules from `core.extension.yml`
- Removed `transliterate_filenames` from `core.extension.yml`
- Updated `editor.editor.formatted.yml` from ckeditor to ckeditor5
- Removed `admin_audit_trail` dependency from `user.role.admin_users.yml`

### 9. Verification

- JSON:API `/jsonapi/node/article` → 200 OK, returns 4 articles
- JSON:API `/jsonapi/menu_items/main` → 200 OK
- Jest suite → 13 suites, 29 tests passing
- `ddev drush status` → Drupal 11.3.9, PHP 8.3.30, MariaDB 10.6
- Config exported with `ddev drush cex`

## Known Issues

### Cypress Tests

Cypress E2E tests cannot run due to Node.js 24 incompatibility with Nuxt 2's webpack 4 (ERR_OSSL_EVP_UNSUPPORTED). This is a frontend tooling issue, not related to the Drupal upgrade. Fix options:

- Use `NODE_OPTIONS=--openssl-legacy-provider`
- Use Node 16 via nvm for Cypress runs
- Upgrade to Nuxt 3/4 (separate future change)

### Remaining Modules Without Stable D11 Releases

These modules are installed from dev/alpha/beta versions:

- `entity_clone` — 2.1.0-beta1
- `entity_usage` — 2.0.0-beta28
- `field_group` — 4.0.x (alpha for D10.3)
- `field_tools` — 1.0.0-alpha14
- `linky` — 2.0.0-beta
- `viewfield` — 3.0.0-beta11
- `simple_oauth` — 6.0.x-dev

Monitor these for stable releases and update when available.
