# Development Setup

## Prerequisites

- [mise](https://mise.jdx.dev/) (manages Node 24 + pnpm 10 for the frontend)
- PHP 8.1+, Composer, Docker + DDEV (only needed for the Drupal backend,
  which the frontend does not depend on — see
  [Architecture](architecture.md))

## Frontend (Nuxt 4)

```bash
mise install                # installs Node 24 + pnpm 10 per .mise.toml
mise run install             # pnpm install (in nuxt/)
mise run dev                 # http://localhost:3000
mise run hooks:install       # optional: enable commit-msg + pre-commit hooks
```

The `@stuartclark/ui` design system is consumed as `link:../../ui` — the
sibling `apps/ui` submodule must be checked out alongside `apps/stuar.tc`
for local development.

## Backend (Drupal, optional)

The Drupal backend is not consumed by the frontend build, but can be run
independently for backend work (JSON:API, module development):

```bash
cd drupal
ddev start
ddev install                 # creates database, imports config
ddev drush status            # verify Drupal is running
```

## Common Commands

### Frontend (from `nuxt/`, or via `mise run <task>` from the repo root)

| Command | Description |
|---------|-------------|
| `mise run dev` | Start dev server |
| `mise run storybook` | Storybook on :6006 |
| `mise run dev:all` | Nuxt + Storybook concurrently (tunnel URLs) |
| `mise run generate` | Static build → `nuxt/.output/public/` |
| `mise run test` | Vitest (100% coverage enforced) |
| `mise run test:visual` | Generate + Playwright visual suite |
| `mise run lint` | ESLint |
| `mise run lint:all` | All linters (ESLint, Markdownlint, Stylelint, cspell, knip) |
| `mise run typecheck` | `nuxt typecheck` (vue-tsc) |
| `mise run ci` | typecheck + lint + style + md + spell + knip + tests |
| `mise run ci:full` | + visual regression + SEO audit |

### Backend (from `drupal/`, via DDEV)

| Command | Description |
|---------|-------------|
| `ddev start` / `ddev stop` | Start / stop the environment |
| `ddev install` | Initialize site (database, config) |
| `ddev drush uli` | Get login one-time URL |
| `ddev drush cr` | Clear cache |
| `ddev drush updb` | Run database updates |
| `ddev drush cim` | Import config |
| `ddev phpunit` | Run PHPUnit kernel tests |
| `ddev phpcs` / `ddev phpcbf` | PHP CodeSniffer lint / autofix |
| `ddev phpstan` | Static analysis |

## Troubleshooting

### Frontend Issues

**Module not found errors**

```bash
rm -rf nuxt/node_modules
mise run install
```

**Port already in use**

```bash
lsof -ti:3000 | xargs kill -9
```

### Backend Issues

**Database connection failed**

```bash
ddev restart
```

**Missing configuration**

```bash
ddev drush cim -y
```
