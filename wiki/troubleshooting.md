# Troubleshooting Guide

## Frontend Issues

### Nuxt Build Failures

**Error: Module not found**

```
Error: Cannot find module 'druxt-site'
```

Solution:
```bash
cd nuxt
npm install
```

**Error: CSS not loading**

Check Tailwind configuration in `tailwind.config.js` and ensure all paths are correct.

### Jest Test Failures

**Error: Missing required prop 'fields'**

Many Druxt components require `fields` and `schema` props from the mixin. Tests may fail if not properly mocked.

Solution:
```javascript
jest.mock('druxt-entity', () => ({
  DruxtEntityMixin: {
    data() {
      return { fields: {}, schema: {} }
    },
  },
}))
```

**Error: Cannot read properties of undefined**

Usually means Vue component is trying to access props/data that aren't provided in tests. Use `shallowMount` and provide minimal props.

### Cypress Test Failures

**Error: Cypress could not verify**

Make sure the server is running before executing Cypress:
```bash
npm run serve &
npm run test:cy
```

## Backend Issues

### Drupal Module Updates Fail

**Error: Cannot update - unmet dependencies**

Check for module conflicts:
```bash
composer why-not drupal/module_name:version
```

Often resolved by updating multiple modules together:
```bash
composer update drupal/mod1 drupal/mod2 --with-all-dependencies
```

### Database Update Failures

**Error: PDOException**

Usually a database connection issue:
```bash
ddev drush sql:connect
```

Verify settings in `web/sites/default/settings.php`.

### JSON:API Not Working

Check if JSON:API module is enabled:
```bash
ddev drush pm:enable jsonapi
```

Clear cache:
```bash
ddev drush cr all
```

## Integration Issues

### Nuxt Cannot Connect to Drupal

1. Verify Drupal is accessible:
   ```bash
   curl http://stuartclark.ddev.site
   ```

2. Check BASE_URL in nuxt.config.js matches Drupal URL

3. Verify Drupal JSON:API endpoint:
   ```bash
   curl http://stuartclark.ddev.site/jsonapi
   ```

### Authentication Issues

If using authenticated requests:
1. Check simple_oauth module is configured
2. Verify token endpoints work
3. Check Drupal log for auth errors

## Performance Issues

### Slow Page Loads

- Enable static generation: `npm run generate`
- Check Memcache is running
- Review Drupal caching configuration

### Large Bundle Size

Run bundle analysis:
```bash
npm run build -- --analyze
```

## Common Error Messages

| Error | Solution |
|-------|----------|
| `TypeError: Cannot read properties of undefined` | Add proper props/mocks in tests |
| `Error: ENOENT: no such file or directory` | Check file paths, reinstall dependencies |
| `Module not found` | Run `npm install` or `composer install` |
| `CORS error` | Configure CORS in Drupal or check BASE_URL |

## Getting Help

1. Check Drupal logs: `ddev drush watchdog:show`
2. Check Nuxt logs in browser console
3. Check DDev logs: `ddev logs`
4. Review module issue queues on drupal.org