This directory contains scripts used for development. These can be used locally and in the CI environment — no Docker/DDEV required, just PHP, Composer, and SQLite.

Adapted from the `.devtools/` pattern used across Stuart's own Drupal extension repos (`field_tokens`, `custom_formatters`, `imagefield_tokens`), in the spirit of `AlexSkrypnyk/drupal_extension_scaffold` — but for a full site checkout rather than a bare extension: there's no `build/` directory or `composer create-project` step, since `drupal/` already IS the site codebase.

| Script      | Purpose                                                                                          |
|-------------|---------------------------------------------------------------------------------------------------|
| `assemble`  | Install Composer dependencies.                                                                    |
| `provision` | Patch in the `sqlite` module, configure a throwaway SQLite database, and `drush tome:install` the committed config/content. |
| `start`     | Launch the built-in PHP development server (docroot `web/`). Auto-discovers a free port, writes `.env`, and prints a one-time login link (tunnel URL if active) once the site is provisioned. |
| `stop`      | Stop the development server.                                                                      |
| `info`      | Print a read-only summary of the current environment (PHP/Drupal/Composer/Drush versions, webserver, database path). |
| `helpers.php` | Shared PHP utilities (dotenv read/write, port discovery, drush wrapper, filesystem helpers).     |

## Quick start

```bash
cd drupal
.devtools/assemble
.devtools/provision
.devtools/start
```

Or via `make` (see the root `Makefile`):

```bash
make build   # assemble + provision + start
make stop
make reset   # wipe the throwaway database and stop the server
```

## Custom scripts

`provision`, `start`, and `stop` each look for `scripts/<prefix>-*.sh` in the project root and run any matches at the end of the phase — `provision-*.sh` for post-provision (e.g. Simple OAuth + `story-sync` user/Consumer setup for `push-story.mjs`), `start-*.sh` for post-start, `stop-*.sh` for pre-stop. Scripts run in lexicographic order, inherit the parent environment, and a non-zero exit aborts the parent.

### Cloudflare tunnel

`scripts/{provision,start,stop}-cloudflared.sh` expose the local dev server via a Cloudflare quick
tunnel, matching the same pattern used across `field_tokens`/`custom_formatters`/`imagefield_tokens`
and the Nuxt frontend's own `nuxt-cloudflared-tunnel` module. **On by default** — `make build`/
`make start` open a tunnel automatically. Opt out with `CLOUDFLARE_TUNNEL=0`:

```bash
make build              # tunnel on by default
CLOUDFLARE_TUNNEL=0 make build   # local-only, no tunnel
```

Requires `cloudflared` on `PATH` — silently skipped (with a message) if it isn't installed. The
tunnel URL is written to `.env` as `TUNNEL_URL`, which `start`/`provision`/`info` and the Makefile's
`DRUSH_URI` all prefer over the local URL once set, so `make login`/`make drush` links work from
outside. `provision-cloudflared.sh` also configures Drupal's `trusted_host_patterns`/`reverse_proxy`
settings (`web/sites/default/settings.local.php`, gitignored) so requests via `*.trycloudflare.com`
aren't rejected.

## Gotcha: Tome auto-exports on entity/config save

Tome watches entity and config save operations and writes changes straight to
`content/*.json` / `config/sync/*.yml` as they happen — not just on an
explicit `drush tome:content-export`. In an ephemeral CI checkout this is
invisible (the checkout is thrown away after the job), but in a persistent
local checkout, running `provision` (or the Simple OAuth hook, which creates
a real user/role/Consumer) **will** leave real file changes behind: a
regenerated UUID on some config entity, a new `user.*.json`/`consumer.*.json`,
etc. Review `git status` after a local `provision` run and discard anything
that isn't an intentional change before committing.

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `WEBSERVER_HOST` | `127.0.0.1` | PHP built-in server bind host |
| `WEBSERVER_PORT` | auto-discovered (8888+) | PHP built-in server port |
| `DB_FILE` | `/tmp/stuartclark-site.sqlite` | SQLite database path |
| `XDEBUG` | unset | Set to any non-empty value to start the server with Xdebug enabled |
| `CLOUDFLARE_TUNNEL` | `1` (on) | Set to `0` to disable the Cloudflare quick tunnel and stay local-only (see below) |
