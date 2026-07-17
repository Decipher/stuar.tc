// Mirrors the paragraph bundle types drupal/scripts/sync-content.mjs emits
// and nuxt/content.config.ts's articleEntries schema validates — the 5
// Layout Paragraphs bundles actually used across the site's articles.
export type Paragraph =
  | { type: 'text_formatted', html: string }
  | { type: 'code', title?: string, code: string }
  | { type: 'repository', description: string, url: string, gitpod: boolean }
  | { type: 'media', alt: string, caption?: string, width?: number, height?: number, src: string }
  | { type: 'section', title?: string, layout: string, regions: Record<string, Paragraph[]> }
