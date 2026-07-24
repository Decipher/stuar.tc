# Troubleshooting Guide

## Frontend Issues

### Nuxt Build Failures

**Error: Cannot find module '@stuartclark/ui'**

The design system is consumed as `link:../../ui`. Make sure the sibling
`apps/ui` submodule is checked out and built:

```bash
cd ../../ui && pnpm install && pnpm prepare
cd ../stuar.tc/nuxt && pnpm install
```

**Error: CSS classes not generating (Tailwind v4)**

`@stuartclark/ui` components' Tailwind classes only appear if the package's
build output is staged where the Tailwind v4 scanner can see it. Rebuild the
`ui` package (`pnpm prepare` / `pnpm build` in `apps/ui`) and restart `mise
run dev`.

### Vitest Failures

**Error: `useNuxtApp` / auto-imports undefined in tests**

Mount via `@nuxt/test-utils/runtime` (`mountSuspended`), not
`@vue/test-utils` directly — see [Testing Guide](testing-guide.md).

**Coverage gate failure**

Coverage is enforced at 100% on `app/**`. Add tests for any new code path
before merging; `mise run test:coverage` shows the report.

### Playwright Visual Failures

**Error: Snapshot mismatch after a legitimate UI change**

Regenerate baselines via the manual `visual:update` CI job on the **x86_64**
GitLab runner (never from an ARM host), download the snapshot artifact, and
commit the PNGs. See [Testing Guide](testing-guide.md).

**Error: Visual diff is just live data changing**

Check that `freezeDynamicContent()` covers the new dynamic element (stats,
activity feed, contribution heatmap) — it should be masked, not baked into
the baseline.

## Backend Issues

### Drupal Module Updates Fail

**Error: Cannot update - unmet dependencies**

```bash
cd drupal && composer why-not drupal/module_name:version
composer update drupal/mod1 drupal/mod2 --with-all-dependencies
```

### Database Update Failures

**Error: PDOException**

```bash
make reset && make build
```

Verify settings in `drupal/web/sites/default/settings.php` — the SQLite
override `make provision` appends there is ephemeral and never committed;
`git checkout -- drupal/web/sites/default/settings.php` if it looks wrong.

### JSON:API / PHPUnit Issues

```bash
make drush pm:enable jsonapi
make drush cr all
make test-kernel    # re-run kernel tests after fixing
```

## Integration Notes

The Nuxt frontend does **not** call the local `drupal/` instance at build
time — `/writing` content is pulled from Drupal only at sync time
(`nuxt/scripts/sync-content.mjs`, run manually) into the `articleEntries`
content collection; everything else (site config, stats, projects) is typed
TS data, plus live stats from the public drupal.org and GitHub APIs at build
time (see [Architecture](architecture.md)). If a page's live data (module
installs, activity feed, DrupalCon list) looks stale or wrong, check the
relevant composable in `nuxt/app/composables/`, not the local Drupal
backend. If `/writing` content looks stale, re-run the content sync.

## Common Error Messages

| Error | Solution |
|-------|----------|
| `Cannot find module '@stuartclark/ui'` | Build the sibling `apps/ui` submodule first |
| `TypeError: Cannot read properties of undefined` (Vitest) | Mount via `@nuxt/test-utils/runtime`, check props/mocks |
| `Error: ENOENT: no such file or directory` | Check paths, re-run `mise run install` |
| Coverage gate failure | Add tests for `app/**` — 100% required |
| `CORS error` (build-time fetch) | Check `GH_TOKEN` / drupal.org endpoint availability |

## Getting Help

1. Check Drupal logs: `make drush watchdog:show`
2. Check Nuxt build/dev logs in the terminal or browser console
3. Check the PHP server log: `/tmp/stuartclark-php-server.log`
4. Review `AGENTS.md` for stack conventions and gotchas
