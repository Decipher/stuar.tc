# Blog post roadmap

What's queued to write next, and where each one goes per
`wiki/syndication-strategy.md`'s decision tree. Point-in-time — update this as
posts get written or priorities shift, rather than treating it as historical
record (that's what git history/CHANGELOG.md are for).

## Ready to write

1. **`nuxt-cloudflared-tunnel` module post** — dev.to `#nuxt` + stuar.tc

   The user's own Nuxt module (`Decipher/nuxt-cloudflared-tunnel` on GitHub,
   ~55 weekly downloads at time of writing). Covers:
   - What Cloudflare Quick Tunnels are
   - Why the module exists vs. `nuxi dev --tunnel`
   - Runtime URL access
   - Multi-service tunneling (this site uses it for Storybook)
   - The port-probing feature

2. **File (Field) Paths release post** — Planet Drupal + stuar.tc

   Stabilizing the ~29.5k-site module, clearing the RC backlog to a stable
   1.0. Already teased in the JSON:API Views post ("tens of thousands of
   sites and still sitting in RC") — write once the release itself ships.

## Next, as modules mature

1. **JSON:API Menu Items release post** — Planet Drupal + stuar.tc
2. **ImageField Tokens release post** — Planet Drupal + stuar.tc

## Deferred

- **Druxt 1.0.0 series** — Planet Drupal + dev.to `#nuxt`, once 1.0.0 ships
- **Nuxt Studio → Drupal/Druxt integration** — dev.to `#nuxt` + stuar.tc, once
  implemented
- **h4ck panel module** — dev.to + stuar.tc, once extracted as its own module

## Done

- Planet Drupal resubmission — confirmed live on drupal.org/planet
  (2026-08-13)
