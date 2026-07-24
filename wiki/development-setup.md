# Development Setup

## Prerequisites

- [mise](https://mise.jdx.dev/) (manages Node 24 + pnpm 10 for the frontend)
- PHP 8.1+, Composer, SQLite (only needed for the Drupal backend, which the
  frontend does not depend on — see [Architecture](architecture.md)). No
  Docker/DDEV required.

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
independently for backend work (JSON:API, module development). No
Docker/DDEV — just PHP, Composer, and SQLite, via `drupal/.devtools/` (see
`drupal/.devtools/README.md` for the full reference):

```bash
cd drupal
make build                   # assemble + provision + start
make info                    # verify Drupal is running
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

### Backend (from `drupal/`, via `.devtools/`/`make`)

| Command | Description |
|---------|-------------|
| `make start` / `make stop` | Start / stop the PHP built-in dev server |
| `make build` | Assemble + provision + start (full local setup) |
| `make provision` | (Re-)install the site — SQLite + Tome import |
| `make drush uli` | Get login one-time URL (alias: `make login`) |
| `make drush cr` | Clear cache |
| `make drush updb` | Run database updates |
| `make drush cim` | Import config |
| `make test` / `make test-kernel` | Run PHPUnit (all suites / kernel only) |
| `make lint` / `make lint-fix` | PHPCS + PHPStan / PHPCBF autofix |
| `make info` | Environment summary (PHP/Drupal/Composer/Drush versions, DB path) |
| `make reset` | Stop the server and wipe the throwaway SQLite database |

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
make reset && make build
```

**Missing configuration**

```bash
make drush cim -y
```
