# Contributing

Contributions are managed by the project owner. These guidelines keep the
codebase consistent across the sibling `@stuartclark` repos.

## Branching

- Use `feat/<short-description>` for new features
- Use `fix/<short-description>` for bug fixes
- Use `docs/<short-description>` for documentation changes
- Use `chore/<short-description>` for tooling/maintenance
- Branch from `develop` (the integration branch)

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.com/):

```text
<type>(<scope>): <description>
```

- **Types**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `ci`, `build`, `perf`, `style`
- **Scope**: `nuxt` (this repo's scope) or an area (`ci`, `docs`, `deps`, `drupal`)
- Example: `feat(nuxt): add /speaking page`

Commit messages are validated by `commitlint` in CI and by the mise-driven
`commit-msg` hook (install it once per clone):

```bash
mise run hooks:install   # sets git core.hooksPath → .githooks/
```

Validate a message locally:

```bash
mise run commitlint ".git/COMMIT_EDITMSG"
```

## Merge Requests

1. Create an MR into `develop` (the Nuxt 4 migration targets `develop`)
2. Ensure the CI pipeline is green before requesting review
3. Squash commits if the branch has fixup/cleanup commits
4. The project owner merges — no self-merge

## Testing & quality gates

| Check | Command | CI job |
|---|---|---|
| Unit + component (100% coverage) | `mise run test` | `test` |
| Type check | `mise run typecheck` | `typecheck` |
| ESLint | `mise run lint` | `lint` |
| Stylelint | `mise run lint:style` | `lint:style` |
| Markdownlint | `mise run lint:md` | `lint:docs` |
| cspell | `mise run lint:spell` | `lint:docs` |
| knip (dead code) | `mise run lint:knip` | `lint:knip` |
| External links (lychee) | — | `linkcheck` |
| Visual regression | `mise run test:visual` | `visual` |
| SEO (Playwright) | — | `seo` |
| SEO/perf audit (unlighthouse) | `mise run lint:seo` | `lint:seo` |

Mirrored locally with `mise run ci` (fast) and `mise run ci:full` (+ visual + SEO).

### Visual regression — critical rules

- **Never regenerate baselines from an ARM host** (e.g. Apple Silicon). Chromium
  renders differ between ARM and x86_64. Use the manual `visual:update` CI job
  (x86_64 runner) and commit the downloaded PNGs.
- Baselines live in `nuxt/tests/visual/*-snapshots/`.

## Code Style

- **Vue/TS**: ESLint (`@nuxt/eslint`) + `eslint-plugin-vuejs-accessibility`
- **Styles**: Stylelint; Tailwind v4 via Nuxt UI — reference tokens, never hardcode hex
- **Markdown**: `mise run lint:md`; project words in `.cspell.json`
- Prefer Nuxt UI primitives over raw HTML

## Cross-project dependency

`@stuartclark/ui` is consumed as `link:../../ui` (workspace sibling). Locally the
`apps/ui` submodule provides it; in CI it is cloned + built per job. If you
change the design system, update `apps/ui` first.

## License

MIT — see [LICENSE](LICENSE) (drupal/ retains its own upstream license).
