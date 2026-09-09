/**
 * Prism highlighting for `code` paragraphs, run at build time.
 *
 * druxtjs.org gets this free from @nuxt/content v1's markdown pipeline, which
 * runs Prism over fenced blocks during `nuxt generate`. Articles here are JSON
 * rather than markdown, so there is no fence to read a language from and no
 * parser to hook. Instead the paragraph declares its `language` and
 * scripts/highlight-code.mjs writes the token markup into the article beside
 * the code, the same way sync-content.mjs writes everything else there.
 *
 * Two other places were tried first and are worth not repeating. Highlighting
 * in the component puts Prism in the client graph — measured at 28kB over
 * three chunks, which Nuxt then prefetches from every article page for
 * something no reader executes. Highlighting in a zod transform in
 * content.schema.ts runs, but @nuxt/content stores the parsed input and
 * discards the transform's output, so the markup never reaches the page.
 *
 * Plain ESM rather than TypeScript so that the build script and the content
 * schema can share one copy of the language list.
 */
import Prism from 'prismjs'

// Prism's core carries markup, css, clike and javascript; the rest register
// themselves onto the core object on import. Static so that everything is
// loaded before the first transform runs, and so the set is greppable.
import 'prismjs/components/prism-bash.js'
import 'prismjs/components/prism-json.js'
// prism-php extends markup-templating, which has to register first or php
// tokenising throws on a missing tokenizePlaceholders.
import 'prismjs/components/prism-markup-templating.js'
import 'prismjs/components/prism-php.js'
import 'prismjs/components/prism-typescript.js'
import 'prismjs/components/prism-yaml.js'

/** Shorthands authors write, resolved to the grammar that handles them. */
/** @type {Record<string, string>} */
const ALIASES = {
  html: 'markup',
  js: 'javascript',
  sh: 'bash',
  shell: 'bash',
  ts: 'typescript',
  vue: 'markup',
  yml: 'yaml',
}

/** Grammars loaded above, plus the four Prism core defines. */
const GRAMMARS = [
  'bash',
  'css',
  'javascript',
  'json',
  'markup',
  'php',
  'typescript',
  'yaml',
]

/**
 * The language meaning "render this verbatim". druxtjs.org uses the same word
 * for the same purpose, so a block moved between the two behaves the same.
 */
export const PLAIN_LANGUAGE = 'text'

/**
 * Every language a `code` paragraph may declare.
 *
 * content.schema.ts validates against this, so a typo fails the content tests
 * rather than publishing an unhighlighted block nobody notices.
 */
export const SUPPORTED_LANGUAGES = [
  PLAIN_LANGUAGE,
  ...GRAMMARS,
  ...Object.keys(ALIASES),
].sort()

/**
 * Highlight `code`, returning Prism's token markup, or null when the language
 * is absent, `text`, or one no grammar covers. A null return is the renderer's
 * signal to print the raw string.
 */
/**
 * @param {string} code
 * @param {string} [language]
 * @returns {string | null}
 */
export function highlightCode(code, language) {
  if (!language || language === PLAIN_LANGUAGE) return null

  const name = ALIASES[language] ?? language
  const grammar = Prism.languages[name]
  if (!grammar) return null

  return Prism.highlight(code, grammar, name)
}
