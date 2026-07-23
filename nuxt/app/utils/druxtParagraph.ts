// Mirrors the paragraph bundle types nuxt/scripts/sync-content.mjs emits
// and nuxt/content.config.ts's articleEntries schema validates — every
// paragraph bundle Drupal's field_content allows (see
// SUPPORTED_PARAGRAPH_BUNDLES in sync-content.mjs and
// checkParagraphSchema(), which warns if Drupal's schema ever grows a
// bundle not listed here).
export type ParagraphLink = { href: string, label: string }

export type Paragraph =
  | { type: 'text_formatted', html: string }
  | { type: 'code', title?: string, code: string }
  | { type: 'repository', description: string, url: string, gitpod: boolean, drupalUrl?: string }
  | { type: 'media', alt: string, caption?: string, width?: number, height?: number, src: string }
  | { type: 'section', title?: string, layout: string, regions: Record<string, Paragraph[]> }
  | { type: 'card', title?: string, description: string, image?: { src: string, alt: string, width?: number, height?: number }, link?: ParagraphLink }
  | { type: 'card_group', cards: Extract<Paragraph, { type: 'card' }>[] }
  | { type: 'jumbotron', title?: string, content: Paragraph[] }
  | { type: 'link', link: ParagraphLink }
