#!/usr/bin/env node
// Syncs Drupal `node--article` content into this app's `articleEntries`
// content collection (see content.config.ts), preserving the Layout
// Paragraphs tree instead of flattening it to markdown.
//
// Queries a live Drupal JSON:API via druxt's own core client (DruxtClient)
// and schema introspection (DruxtSchema) — real dependencies (see
// package.json), patched via pnpm patch (patches/druxt.patch,
// patches/druxt-schema.patch) to drop the axios/consola dependencies in
// favour of fetch/console — against the DDEV instance the GitLab CI sync
// job (or a developer with DDEV running locally) has just installed via
// `ddev install` (Tome). There is no fallback that reads
// ../../drupal/content/*.json directly: the point is to exercise the real
// JSON:API surface, the same contract the stuartc_tests kernel tests and
// the historical Druxt-based frontend used.

import { writeFile, mkdir, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Paragraph bundles buildParagraph() below knows how to transform — kept as
// an explicit list (rather than derived from the switch statement) so
// checkParagraphSchema() can diff it against what Drupal's field_content
// actually allows and warn on drift. Keep this in sync with the switch
// cases by hand.
const SUPPORTED_PARAGRAPH_BUNDLES = ['text_formatted', 'code', 'repository', 'media', 'section', 'card', 'card_group', 'jumbotron', 'link']

const DEFAULTS = {
  baseUrl: 'https://stuartclark.ddev.site',
  filesDir: path.join(__dirname, '../../drupal/files/public'),
  outDir: path.join(__dirname, '../content/articles-data'),
  mediaOutDir: path.join(__dirname, '../public/images/writing'),
}

function parseArgs(argv) {
  const args = { ...DEFAULTS }
  for (const arg of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(arg)
    if (!match) continue
    const key = match[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    if (key in args) args[key] = match[2]
  }
  return args
}

// ---------------------------------------------------------------------------
// Normalized entity repository
// ---------------------------------------------------------------------------
// Every JSON:API resource object (primary `data` or a compound-document
// `included` entry) is normalized to { uuid, entityType, bundle, fields },
// where `fields` values are already unwrapped from JSON:API's
// attributes/relationships split into plain values, `{ value, format }` for
// rich text, or `{ targetUuid }` (single) / `[{ targetUuid }]` (multi) for
// relationships.

export class EntityRepo {
  constructor() {
    /** @type {Map<string, {uuid:string, entityType:string, bundle:string, fields:Record<string,any>}>} */
    this.byUuid = new Map()
  }

  add(entity) {
    this.byUuid.set(entity.uuid, entity)
  }

  get(uuid) {
    return this.byUuid.get(uuid)
  }

  byType(entityType) {
    return [...this.byUuid.values()].filter((e) => e.entityType === entityType)
  }

  all() {
    return [...this.byUuid.values()]
  }
}

// ---------------------------------------------------------------------------
// JSON:API client
// ---------------------------------------------------------------------------

function normalizeResource(resource) {
  const [entityType, bundle] = resource.type.split('--')
  const fields = {}
  for (const [key, value] of Object.entries(resource.attributes ?? {})) {
    if (value && typeof value === 'object' && 'value' in value) {
      // Formatted text: prefer the filter-processed HTML — so text-format
      // filters (e.g. the Linky module's link-placeholder substitution)
      // have already run — over the raw stored value JSON:API also exposes.
      fields[key] = 'processed' in value ? { value: value.processed, format: value.format } : value
    } else {
      fields[key] = value
    }
  }
  for (const [key, rel] of Object.entries(resource.relationships ?? {})) {
    if (!rel?.data) continue
    // Image relationships (e.g. field_media_image) carry alt/title/width/
    // height as relationship `meta`, not as attributes — preserve it.
    // `targetType` (the JSON:API `type` of the referenced resource) matters
    // for dynamic_entity_reference fields (e.g. field_link), which can
    // point at different entity types per-reference — resolveLink() below
    // branches on it.
    fields[key] = Array.isArray(rel.data)
      ? rel.data.map((d) => ({ targetUuid: d.id, targetType: d.type, ...d.meta }))
      : { targetUuid: rel.data.id, targetType: rel.data.type, ...rel.data.meta }
  }
  return { uuid: resource.id, entityType, bundle, fields }
}

async function loadArticles(druxt) {
  const repo = new EntityRepo()
  const pages = await druxt.getCollectionAll('node--article', {
    include: [
      'field_content',
      'field_content.field_media',
      'field_content.field_media.field_media_image',
      'field_article_category',
      'field_article_type',
    ].join(','),
  })
  const resources = pages.flatMap((body) => [...(body.data ?? []), ...(body.included ?? [])])
  const seen = new Set()
  for (const resource of resources) {
    if (seen.has(resource.id)) continue
    seen.add(resource.id)
    repo.add(normalizeResource(resource))
  }
  return repo
}

// media `field_media_image`'s target file isn't reachable via a JSON:API
// `include` path from the article (it's nested two levels past a
// relationship JSON:API doesn't expand attributes for), so it's fetched
// directly once we know which media entities are actually referenced.
async function loadFiles(druxt, repo) {
  const fileUuids = new Set()
  for (const media of repo.byType('media')) {
    const targetUuid = media.fields.field_media_image?.targetUuid
    if (targetUuid) fileUuids.add(targetUuid)
  }
  for (const uuid of fileUuids) {
    const body = await druxt.getResource('file--file', uuid)
    if (!body?.data) {
      console.warn(`sync-content: could not fetch file ${uuid}`)
      continue
    }
    repo.add(normalizeResource(body.data))
  }
}

// card_group's field_cards and jumbotron's field_content are dedicated
// entity_reference_revisions fields on those paragraphs — unlike section's
// children, they don't go through the flat field_content+parent_uuid
// mechanism `section` uses, so their targets aren't pulled in by the
// article-level `include` chain. card/link's field_link is a
// dynamic_entity_reference that can point at a node or a linky entity, so
// its target type varies. Rather than hand-craft an `include` path for
// every nesting depth and target type, repeatedly fetch whatever relationship
// target is still missing from anything already known, until a full pass
// finds nothing new (a fixed point) — the same "fetch what's not includable"
// approach loadFiles() already uses for media files, generalised.
async function resolveRelationships(druxt, repo) {
  for (let pass = 0; pass < 5; pass++) {
    const missing = new Map()
    for (const entity of repo.all()) {
      for (const value of Object.values(entity.fields)) {
        for (const ref of refs(value)) {
          if (ref?.targetUuid && ref.targetType && !repo.get(ref.targetUuid)) {
            missing.set(ref.targetUuid, ref.targetType)
          }
        }
      }
    }
    if (missing.size === 0) break
    for (const [uuid, targetType] of missing) {
      let body
      try {
        body = await druxt.getResource(targetType, uuid)
      } catch (err) {
        // Some relationship targets aren't real fetchable resources (e.g. a
        // taxonomy term's own vocabulary/parent references) or the anonymous
        // API user may lack access — skip rather than aborting the whole
        // sync over a reference nothing downstream actually needs.
        console.warn(`sync-content: could not fetch ${targetType} ${uuid} — ${err.message}`)
        continue
      }
      if (!body?.data) {
        console.warn(`sync-content: could not fetch ${targetType} ${uuid}`)
        continue
      }
      repo.add(normalizeResource(body.data))
    }
  }
}

// Resolves a dynamic_entity_reference (field_link) to a plain { href, label }.
function resolveLink(repo, ref) {
  const target = ref?.targetUuid && repo.get(ref.targetUuid)
  if (!target) return undefined

  if (target.entityType === 'linky') {
    return { href: target.fields.link?.uri ?? '', label: target.fields.link?.title ?? '' }
  }

  if (target.entityType === 'node' && target.bundle === 'article') {
    const title = target.fields.field_display_title ?? target.fields.title ?? ''
    return { href: target.fields.path?.alias || `/writing/${slugify(title)}`, label: title }
  }

  // field_link can technically target other node bundles (event, page) or
  // other entity types Drupal's field config permits — none are used by any
  // content yet, and this site has no established frontend route for them,
  // so fall back to the raw title with no href rather than guessing a URL
  // convention that doesn't exist.
  const title = target.fields.field_display_title ?? target.fields.title ?? target.fields.name ?? ''
  return title ? { href: '', label: title } : undefined
}

// Warns (does not fail the sync) when Drupal's field_content now allows a
// paragraph bundle buildParagraph() doesn't handle — the bundle being
// *allowed* doesn't mean it's *used* yet; buildParagraph()'s own default
// case still throws loudly the moment one is actually encountered in
// content. This is the proactive, earlier signal.
async function checkParagraphSchema(baseUrl) {
  const { DruxtSchema } = await import(/* @vite-ignore */ 'druxt-schema')
  const schema = new DruxtSchema(baseUrl)
  const articleSchema = await schema.getSchema({ entityType: 'node', bundle: 'article', mode: 'default', schemaType: 'view' })
  const targetBundles = articleSchema?.schema?.fields?.find((f) => f.id === 'field_content')?.settings?.config?.handler_settings?.target_bundles

  if (!targetBundles) {
    console.warn('sync-content: could not read field_content schema — skipping paragraph-bundle drift check.')
    return
  }

  const unsupported = Object.keys(targetBundles).filter((bundle) => !SUPPORTED_PARAGRAPH_BUNDLES.includes(bundle))
  for (const bundle of unsupported) {
    console.warn(`sync-content: field_content now allows paragraph type "${bundle}" that sync-content.mjs doesn't handle — add a case to buildParagraph() or confirm it's intentionally unused.`)
  }

  return unsupported
}

// ---------------------------------------------------------------------------
// Transform: entities -> articleEntries content collection shape
// ---------------------------------------------------------------------------

export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function refs(field) {
  if (!field) return []
  return Array.isArray(field) ? field : [field]
}

function html(field) {
  // Most rich-text attributes come through as { value, format }, but plain
  // string fields (e.g. field_description, a simple text field, not a
  // formatted long-text one) are JSON:API string attributes with no .value
  // wrapper at all.
  if (typeof field === 'string') return field
  return field?.value ?? ''
}

function buildParagraph(repo, uuid, childrenByParent) {
  const entity = repo.get(uuid)
  if (!entity) return null
  const { bundle, fields } = entity

  switch (bundle) {
    case 'text_formatted':
      return { type: 'text_formatted', html: html(fields.field_text_formatted) }

    case 'code':
      return {
        type: 'code',
        title: fields.field_title ?? undefined,
        code: fields.field_code ?? '',
      }

    case 'repository':
      return {
        type: 'repository',
        description: html(fields.field_description),
        url: fields.field_url?.uri ?? '',
        gitpod: Boolean(fields.field_gitpod),
        drupalUrl: fields.field_drupal_url?.uri || undefined,
      }

    case 'media': {
      const media = repo.get(fields.field_media?.targetUuid)
      const image = media?.fields?.field_media_image
      const file = repo.get(image?.targetUuid)
      return {
        type: 'media',
        alt: image?.alt ?? '',
        caption: html(media?.fields?.field_media_caption) || undefined,
        width: image?.width,
        height: image?.height,
        src: file ? `/images/writing/${path.basename(file.fields.uri.value)}` : '',
      }
    }

    case 'section': {
      const layoutSettings = fields.behavior_settings?.layout_paragraphs ?? {}
      const children = childrenByParent.get(uuid) ?? []
      const regions = {}
      for (const child of children) {
        const region = repo.get(child)?.fields?.behavior_settings?.layout_paragraphs?.region ?? 'content'
        regions[region] ??= []
        regions[region].push(buildParagraph(repo, child, childrenByParent))
      }
      return {
        type: 'section',
        title: fields.field_title ?? undefined,
        layout: layoutSettings.layout ?? 'layout_onecol',
        regions,
      }
    }

    case 'card': {
      const media = repo.get(fields.field_image?.targetUuid)
      const imageRel = media?.fields?.field_media_image
      const file = repo.get(imageRel?.targetUuid)
      return {
        type: 'card',
        title: fields.field_title ?? undefined,
        description: html(fields.field_text_formatted),
        image: file
          ? {
              src: `/images/writing/${path.basename(file.fields.uri.value)}`,
              alt: imageRel?.alt ?? '',
              width: imageRel?.width,
              height: imageRel?.height,
            }
          : undefined,
        link: resolveLink(repo, fields.field_link),
      }
    }

    case 'card_group':
      return {
        type: 'card_group',
        cards: refs(fields.field_cards)
          .map((r) => buildParagraph(repo, r.targetUuid, childrenByParent))
          .filter((p) => p?.type === 'card'),
      }

    case 'jumbotron':
      return {
        type: 'jumbotron',
        title: fields.field_title ?? undefined,
        content: refs(fields.field_content)
          .map((r) => buildParagraph(repo, r.targetUuid, childrenByParent))
          .filter(Boolean),
      }

    case 'link':
      return { type: 'link', link: resolveLink(repo, fields.field_link) ?? { href: '', label: '' } }

    default:
      throw new Error(`No sync transform for paragraph bundle "${bundle}" (uuid ${uuid}) — add one in buildParagraph() before this can render.`)
  }
}

// A single regex pass over `<[^>]+>` can be reconstructed by nested tags
// (e.g. `<scr<script>ipt>` loses only the inner `<script>` in one pass,
// leaving `<script>` reformed from the leftovers) — loop to a fixed point so
// nothing is left half-stripped.
function stripHtmlTags(html) {
  let previous
  let stripped = html
  do {
    previous = stripped
    stripped = previous.replace(/<[^>]+>/g, ' ')
  } while (stripped !== previous)
  return stripped
}

function flattenText(paragraph) {
  if (!paragraph) return []
  if (paragraph.type === 'text_formatted') return [stripHtmlTags(paragraph.html)]
  if (paragraph.type === 'section') return Object.values(paragraph.regions).flat().flatMap(flattenText)
  return []
}

export function buildArticle(repo, node) {
  const { fields } = node
  const title = fields.field_display_title ?? fields.title

  const articleType = refs(fields.field_article_type)
    .map((r) => repo.get(r.targetUuid)?.fields?.name)
    .filter(Boolean)[0]
  const categories = refs(fields.field_article_category)
    .map((r) => repo.get(r.targetUuid)?.fields?.name)
    .filter(Boolean)

  const topLevelUuids = refs(fields.field_content).map((r) => r.targetUuid)
  const childrenByParent = new Map()
  for (const uuid of topLevelUuids) {
    // field_content is a flat list containing both top-level paragraphs and
    // their nested children (Layout Paragraphs tracks nesting via each
    // paragraph's own behavior_settings.layout_paragraphs.parent_uuid, not
    // a separate reference field) — group here before walking the tree.
    const parentUuid = repo.get(uuid)?.fields?.behavior_settings?.layout_paragraphs?.parent_uuid
    if (parentUuid) {
      if (!childrenByParent.has(parentUuid)) childrenByParent.set(parentUuid, [])
      childrenByParent.get(parentUuid).push(uuid)
    }
  }
  const rootUuids = topLevelUuids.filter((uuid) => !repo.get(uuid)?.fields?.behavior_settings?.layout_paragraphs?.parent_uuid)

  const paragraphs = rootUuids.map((uuid) => buildParagraph(repo, uuid, childrenByParent))
  const wordCount = paragraphs.flatMap(flattenText).join(' ').split(/\s+/).filter(Boolean).length
  // field_description is a plain string field, but old content stored it
  // with literal CRLF paragraph breaks — collapse all whitespace (not just
  // trim the ends) so it reads as a clean single-line summary everywhere
  // it's used verbatim: og:description, twitter:description, meta
  // description, RSS item description, homepage excerpt.
  const description = stripHtmlTags(html(fields.field_description)).replace(/\s+/g, ' ').trim()

  return {
    title,
    // Drupal's own pathauto-computed alias (exposed by JSON:API on every
    // node as `attributes.path.alias`, already captured verbatim by
    // normalizeResource()) is the source of truth — falls back to the
    // hand-rolled slug only if a node somehow has no alias yet.
    path: fields.path?.alias || `/writing/${slugify(title)}`,
    // Full ISO 8601 timestamp — not truncated to just the date. Two
    // articles can share a calendar day but have genuinely different
    // publish times (confirmed real case: two 2022-03-01 posts published
    // hours apart) — only the untruncated value sorts them correctly.
    // Display code is responsible for formatting this down to a date.
    date: fields.field_published ?? fields.created ?? '',
    description,
    readingTime: `${Math.max(1, Math.round(wordCount / 200))} min`,
    articleType,
    categories,
    paragraphs,
  }
}

// ---------------------------------------------------------------------------
// Media + output writers
// ---------------------------------------------------------------------------

async function copyMedia(repo, { filesDir, mediaOutDir }) {
  await mkdir(mediaOutDir, { recursive: true })
  for (const file of repo.byType('file')) {
    const uri = file.fields.uri?.value
    if (!uri?.startsWith('public://')) continue
    const relative = uri.replace('public://', '')
    const src = path.join(filesDir, relative)
    const dest = path.join(mediaOutDir, path.basename(relative))
    try {
      await copyFile(src, dest)
    } catch (err) {
      console.warn(`sync-content: could not copy media file ${src} — ${err.message}`)
    }
  }
}

async function writeArticles(articles, { outDir }) {
  await mkdir(outDir, { recursive: true })
  for (const article of articles) {
    const filename = `${path.basename(article.path)}.json`
    await writeFile(path.join(outDir, filename), JSON.stringify(article, null, 2) + '\n')
  }
}

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const { DruxtClient } = await import(/* @vite-ignore */ 'druxt')
  const druxt = new DruxtClient(args.baseUrl)

  const unsupportedBundles = await checkParagraphSchema(args.baseUrl)

  const repo = await loadArticles(druxt)
  await loadFiles(druxt, repo)
  await resolveRelationships(druxt, repo)

  const articles = repo.byType('node')
    .filter((node) => node.bundle === 'article')
    .map((node) => buildArticle(repo, node))
    // `date` is a full timestamp now, so this already sorts two
    // same-calendar-day articles in true publish order.
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  await writeArticles(articles, args)
  await copyMedia(repo, args)

  console.log(`sync-content: wrote ${articles.length} article(s) from ${args.baseUrl}`)
  for (const article of articles) {
    console.log(`  - ${article.path} (${article.paragraphs.length} top-level paragraphs, ${article.categories.join(', ')})`)
  }
  if (unsupportedBundles?.length) {
    console.log(`sync-content: ${unsupportedBundles.length} unsupported paragraph bundle(s) allowed by schema but unused: ${unsupportedBundles.join(', ')}`)
  }
}

// Guarded so this file can be imported for unit tests (see
// tests/scripts/sync-content.spec.ts) without immediately trying to reach a
// live Drupal instance — only runs main() when executed directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
