# stuar.tc Dev Tools

A secret overlay suite embedded in the site. Activated via the Konami
code, on every build — dev and production. Once unlocked, production
visitors see only the **Version** section below; the rest (Color
Scheme, Dev Overlay, Measure Tool, Module List, Client Data) stays
dev-only, gated on `import.meta.dev`, and its code never ships to
production visitors at all (see "Implementation notes").

## Unlocking

Enter the Konami code anywhere on the page (not in a text input):

```text
↑ ↑ ↓ ↓ ← → ← → A B
```

A faint **π** badge appears in the bottom-right corner. Each key must
be pressed within 2 seconds of the previous one. The badge state
persists to `localStorage` so you don't need to re-enter the sequence
after a page refresh.

## Password

Clicking the π badge opens a password prompt. The passphrase is:

> **Hack The Planet** — any leet-speak variant works (e.g.
> `h4ck_th3_pl4n3t`, `h@ck 7h3 pl@n37`, etc.)

Authentication is session-only; it resets on page reload.

## Dev Console

After authenticating, clicking π opens the **Dev Console**
(`H4CK TH3 PL4N3T`).

### Version

The site's current version (from `CHANGELOG.md`) and a **Changelog**
toggle. Collapsed by default — expanding it renders the full release
history inline, in a scrollable box, without leaving the panel or
pushing the rest of the console (dev tools, in dev mode) below the
fold. There's no separate `/changelog` page; this is the only place
it renders. This section is available in production.

### Color Scheme

Switch the site's primary colour at runtime. Changes update every
theme-reactive element immediately.

| Swatch    | Hex       |
|-----------|-----------|
| Magenta   | `#c21a74` |
| Electric  | `#1f4fe0` |
| Violet    | `#7c3aed` |
| Cyan      | `#0891b2` |
| Amber     | `#d97706` |
| Orange    | `#ea580c` |

The selection is not persisted — it resets to the app's default on
reload.

### Dev Overlay

| Control      | What it does |
|--------------|-------------|
| **Grid**     | Toggles a dot grid at 4 px or 8 px intervals over the full viewport |
| **Columns**  | Shows the `max-w-6xl` (72 rem) container boundary, the `px-6`/`sm:px-10` padding zones (24 px / 40 px), and the centreline |
| **Outlines** | Adds a 1 px `color-mix` outline to every non-dev element, revealing the true box model |
| **Opacity**  | Controls how opaque the grid and guide overlays are (10–80%) |

Overlay prefs (grid size, columns, outlines, opacity) are persisted
to `localStorage`.

### Measure Tool

Click **Start** to enter measure mode (the console closes
automatically).

#### How to use

1. **Hover** over any element — a dashed box appears with its tag,
   id, class, and pixel dimensions.
2. **Click** to pin it as **[A]** (solid border with corner markers).
3. **Hover or click** a second element to set **[B]**.
4. The tool shows:

   - **H gap** — horizontal clear space between the two elements
     (in px)
   - **V gap** — vertical clear space (in px)
   - **Alignment tags** — which edges or centre lines the two
     elements share (within 2 px tolerance): `top ✓`,
     `bottom ✓`, `left ✓`, `right ✓`, `H-centre ✓`,
     `V-centre ✓`
   - **Gap lines** — pixel-labelled ruler lines drawn directly on
     the page

5. **Click again** (third click) to start a new measurement with the
   clicked element as the new [A].

#### Keyboard shortcuts (measure mode)

| Key   | Action |
|-------|--------|
| `ESC` | First press: clears current selection (keeps measure mode). Second press: exits measure mode. |

#### Use case example — verifying OSS page panel alignment

The OSS page uses a two-column grid:

```html
<div class="lg:grid-cols-[1.15fr_1fr] lg:divide-x">
```

To confirm the two panels are vertically centred:

1. Enter measure mode.
2. Click the left panel.
3. Click the right panel.
4. Look for **H-centre ✓** in the HUD — confirms both panels share
   the same vertical midpoint.

### Client Data

| Control          | What it does |
|------------------|-------------|
| **Nuxt payload** | Toggles a `<pre>` dump of `useNuxtApp().payload.data` — the data layer Nuxt serialized during SSR |
| **Static shell** | Fetches the page's generated HTML (`fetch(location.href)`) and renders it in a full-viewport `<iframe :srcdoc>` at z-index 9999, so you can compare the static SSG output against the live hydrated page |

The static shell is most meaningful against `nuxt preview` of a
generated site. In `nuxt dev` the fetch returns per-request SSR output
instead.

**ESC** or the **✕** button closes the static shell overlay.

## Implementation notes

- Split across two components. `app/components/DevGrid.vue` is the
  shell: Konami detection, the π badge, the password modal, the
  console frame, and the Version section — always rendered
  (`<DevGrid />` in `layouts/default.vue`, unconditional).
  `app/components/DevGridTools.vue` holds the dev-only sections
  (Color Scheme, Dev Overlay, Measure Tool, Module List, Client
  Data), mounted from DevGrid only when `import.meta.dev` is true,
  via Nuxt's `Lazy` component prefix (`<LazyDevGridTools>`) — its
  code is a separate chunk, never fetched by production visitors.
- The changelog is fetched (`queryCollection('changelog')`) and
  rendered (`<LazyContentRenderer>`) only once the console is
  actually opened, and only rendered once the Changelog toggle is
  expanded — both deferred so `@nuxt/content`'s rendering pipeline
  isn't in every visitor's eager bundle for a panel most never find.
  See `nuxt/scripts/sync-changelog.mjs` for how `CHANGELOG.md`
  becomes a content collection in the first place.
- Pure geometry utilities are in `app/utils/dev-measure.ts` —
  side-effect-free and independently unit tested.
- Theme responsiveness uses
  `color-mix(in srgb, var(--ui-primary) X%, transparent)`
  throughout so every element follows colour-scheme switches.
- The password input uses `data-1p-ignore`, `data-lpignore`,
  `data-form-type="other"`, and `autocomplete="new-password"` to
  suppress 1Password and browser autofill.
- Measure overlay uses a full-screen `pointer-events: all` div as a
  capture layer. `elementFromPoint` temporarily blinds the div
  (`pointer-events: none`) to hit-test the real page beneath it.
- DevGrid's own Escape handler covers the console/password modals
  only. DevGridTools owns a second listener for its own overlays
  (measure mode, static shell) — both toggles that open those
  overlays also close the console first, so there's no ordering
  dependency between the two listeners.
- A public, always-visible version indicator also lives in the site
  footer (`@stuartclark/ui`'s `AppFooter`, `version` prop) — separate
  from this panel, for visitors who never find the Konami code.

## Future direction

You've floated eventually splitting this into its own module with
multiple passwords unlocking different tiers — a public-safe one
(this one), separate secret ones, some behind 2FA. Not built yet;
tracked in `openspec/changes/tiered-dev-console-access/`.

## Testing

```bash
# Run all tests including DevGrid/DevGridTools
pnpm test

# Coverage (must stay 100%)
pnpm test:coverage
```

Tests live in:

- `tests/utils/dev-measure.spec.ts` — pure geometry utilities
- `tests/components/DevGrid.spec.ts` — shell: konami, password,
  console open/close, Version section, production-mode behaviour
- `tests/components/DevGridTools.spec.ts` — dev-only sections:
  overlays, measure tool, color scheme, module list, client data
- `tests/seo/seo.spec.ts` — end-to-end check (real browser, real
  Konami code) against the generated production build: footer
  version text, no `/changelog` route, and the panel's changelog
  content rendering inline once unlocked
