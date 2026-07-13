# Drupal 10 Upgrade Notes

## Overview

This document covers upgrading from Drupal 9.4 to Drupal 10.3.x.

## Prerequisites

- [ ] Current site is on Drupal 9.4
- [ ] All contrib modules have compatible D10 versions
- [ ] PHP 8.1+ is available
- [ ] Backups of database and files exist

## Pre-Upgrade Steps

### 1. Audit Current Modules

```bash
cd drupal
composer show --tree | grep drupal/
```

Identify modules that:
- Don't have Drupal 10 versions
- Are deprecated
- Can be removed

### 2. Update Contributed Modules

Update each module to its latest D10-compatible version:

```bash
# Update a specific module
composer update drupal/module_name --with-all-dependencies
```

### 3. Run Update Status

```bash
ddev drush pm:security
ddev drush up:status
```

### 4. Test on Staging

- Create a staging environment
- Run `composer update` there first
- Verify all functionality works

## Upgrade Steps

### 1. Update Composer

```bash
# Update Drupal core to 10.3.x
composer require drupal/core-recommended:^10.3 drupal/core-composer-scaffold:^10.3 drupal/core-project-message:^10.3 --no-update

# Update dependencies
composer update --with-all-dependencies
```

### 2. Run Database Updates

```bash
ddev drush updb
```

### 3. Rebuild Cache

```bash
ddev drush cr
```

### 4. Update Configuration

```bash
ddev drush cim
```

## Common Issues

### Deprecated Modules

Some modules may be deprecated in D10. Check:
- `entity_display_mode` → Use core's display modes
- `admin_toolbar` → Use Gin toolbar

### PHP Compatibility

Ensure all custom code is PHP 8.1 compatible:
```bash
php -l web/modules/custom/*
```

### JavaScript Changes

Some jQuery plugins may need updating for Drupal 10's JS stack.

## Post-Upgrade Verification

- [ ] Homepage loads correctly
- [ ] Admin UI is functional
- [ ] Content can be created/edited
- [ ] JSON:API endpoints work
- [ ] No PHP warnings in logs

## Rollback Plan

If issues occur:

1. Restore database from backup
2. Revert composer.json to D9 version
3. Run `composer install`
4. Clear cache