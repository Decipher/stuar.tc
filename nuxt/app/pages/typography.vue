<script setup lang="ts">
/**
 * Typography visual-regression fixture.
 *
 * Not a public page (robots-disallowed + excluded from the sitemap; no nav
 * link). Its sole purpose is to render the article prose component with
 * representative inline markup — crucially inline <code>, which no synced
 * /writing article currently contains — so the visual suite
 * (tests/visual/home.spec.ts) has a real surface to snapshot the prose-code
 * chip classes against. See the "typography fixture visual regression" test.
 */
import type { Paragraph } from '~/utils/druxtParagraph'

// cspell:disable — fixture prose
const fixtureParagraph: Extract<Paragraph, { type: 'text_formatted' }> = {
  type: 'text_formatted',
  html: [
    '<p>Inline code like <code>const total = price * qty</code> should read as a distinct accent chip, while <a href="https://example.com">a normal link</a> stays plain underlined text — the two share a hue but must not collide.</p>',
    '<p>Other inline styles keep their own treatment: <strong>strong is bold</strong>, <em>emphasis is italic</em>, and a second code span <code>$ drush cr</code> sits next to them without overpowering the line.</p>',
    '<ul><li>A list item with <code>inline_code()</code> inside it.</li><li>Another item referencing <code>hooks.module.yml</code> by filename.</li></ul>',
    '<blockquote><p>A blockquote keeps its own surface and does not pick up the inline-code chip styling.</p></blockquote>',
  ].join(''),
}
// cspell:enable
</script>

<template>
  <main class="mx-auto max-w-prose px-6 py-12 sm:px-10">
    <AppDruxtParagraphTextFormatted :paragraph="fixtureParagraph" />
  </main>
</template>
