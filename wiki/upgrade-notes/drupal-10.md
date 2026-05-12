# Drupal 10 Upgrade Notes

## Overview

The planned staged upgrade (9.4 → 10.3 → 10.4) was **skipped** in favor of a direct Drupal 9.4 → 11 upgrade using the [realityloop/foundry](https://github.com/realityloop/foundry) repo as reference. Foundry is already on Drupal 11.2.5 with nearly all the same modules.

See [drupal-11.md](drupal-11.md) for the actual upgrade steps taken.

## Why Staged Was Skipped

1. Foundry repo (same codebase origin) already resolved all D11 compatibility issues
2. Foundry uses issue fork repos for key modules (druxt, entity_display_mode) with D11 patches
3. Staged approach would have required resolving the same composer conflicts at each stage
4. The site is decoupled (JSON:API only), so admin theme issues are non-blocking

## Key Learnings from the Audit (Still Relevant)

### Module Compatibility

51 of 60 contrib modules had stable D10/D11 releases. Problematic modules:

| Module | Issue | Resolution |
|--------|-------|------------|
| title_field_for_manage_display | No D10/D11 support | Removed (uninstalled) |
| transliterate_filenames | Max ^9 \|\| ^10 | Removed |
| linky_revision_ui | Max ^8 \|\| ^9 \|\| ^10 | Auto-disabled by linky update |
| admin_audit_trail | Not needed for decoupled site | Removed |
| field_group | Only 4.1.0-alpha1 for D10 | Updated (Foundry uses ^4.0) |

### Core Module Changes (D10)

- `ckeditor` removed → replaced by `ckeditor5`
- `color` removed → no replacement needed for decoupled site
- `node_type` condition plugin → renamed to `entity_bundle:node`
