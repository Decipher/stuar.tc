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

### Druxt Module

The Druxt module ecosystem may need updates for D11:
- Check for newer versions
- May need to wait for D11-compatible releases
- Consider alternatives if Druxt is not maintained

### Theme Compatibility

The Gin theme needs to be updated to 4.x for D11:
```bash
composer require drupal/gin:^4.0 drupal/gin_login:^2.0 drupal/gin_toolbar:^2.0
```

## Migration Strategy

If Druxt modules are not D11-ready:

1. **Wait** for D11-compatible versions
2. **Fork** and update modules manually
3. **Replace** with alternative solution (custom Nuxt integration)

This may affect the staged upgrade approach - consider frontend-backend decoupling.