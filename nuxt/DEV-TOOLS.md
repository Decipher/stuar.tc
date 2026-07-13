# stuar.tc Dev Tools

A secret dev-only overlay suite embedded in the site, available only
when running the local dev server (`import.meta.dev`). Activated via
the Konami code. Zero production footprint.

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

- All code lives in `app/components/DevGrid.vue` (rendered via
  `<DevGrid v-if="isDev" />` in `layouts/default.vue`).
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

## Testing

```bash
# Run all tests including DevGrid
pnpm test

# Coverage (must stay 100%)
pnpm test:coverage
```

Tests live in:

- `tests/utils/dev-measure.spec.ts` — pure geometry utilities
- `tests/components/DevGrid.spec.ts` — component interactions
  (konami, password, overlays, measure)
