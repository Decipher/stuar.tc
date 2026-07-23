# Disabled pages

These page components are intentionally kept out of `app/pages/` so Nuxt does
not register routes for them. Visitors hitting `/writing`, `/uses`, `/photos`,
`/drupalgive`, or `/styleguide` get a normal 404 instead of incomplete or
stale content.

The source is preserved here — not deleted — because each section is
expected to come back once it's production-ready (real photography, current
writing, a maintained DrupalGive page, etc).

## Re-enabling a page

1. Move the `.vue` file (and its co-located `.stories.ts` file, if any) from
   `disabled-pages/` back into `app/pages/`.
2. Update any imports in `tests/` that currently point at `~/disabled-pages/*`
   back to `~/pages/*`.
3. Add the route back to the nav/site links in `app/layouts/default.vue` if
   it should be linked, not just reachable by URL.
4. Run `mise run ci` and regenerate visual baselines if the layout changed.

See `openspec/changes/fix-hidden-pages-access/` for why these were disabled.
