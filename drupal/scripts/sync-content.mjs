#!/usr/bin/env node
// Syncs Drupal `node--article` content into the Nuxt app's `articleEntries`
// content collection (see nuxt/content.config.ts), preserving the Layout
// Paragraphs tree instead of flattening it to markdown.
//
// Queries a live Drupal JSON:API — in the spirit of Druxt's DruxtClient —
// against the DDEV instance the GitLab CI sync job (or a developer with
// DDEV running locally) has just installed via `ddev install` (Tome).
// There is no fallback that reads drupal/content/*.json directly: the
// point is to exercise the real JSON:API surface, the same contract the
// stuartc_tests kernel tests and the historical Druxt-based frontend used.

import { writeFile, mkdir, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEFAULTS = {
  baseUrl: 'https://stuartclark.ddev.site',
  filesDir: path.join(__dirname, '../files/public'),
  outDir: path.join(__dirname, '../../nuxt/content/articles-data'),
  mediaOutDir: path.join(__dirname, '../../nuxt/public/images/writing'),
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

class EntityRepo {
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
    fields[key] = Array.isArray(rel.data)
      ? rel.data.map((d) => ({ targetUuid: d.id, ...d.meta }))
      : { targetUuid: rel.data.id, ...rel.data.meta }
  }
  return { uuid: resource.id, entityType, bundle, fields }
}

async function fetchCollection(baseUrl, resourcePath, params) {
  const url = new URL(resourcePath, baseUrl)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  const results = []
  let next = url.toString()
  while (next) {
    const res = await fetch(next)
    if (!res.ok) {
      throw new Error(`JSON:API request failed (${res.status} ${res.statusText}): ${next}`)
    }
    const body = await res.json()
    results.push(...(body.data ?? []), ...(body.included ?? []))
    next = body.links?.next?.href
  }
  return results
}

async function loadArticles(baseUrl) {
  const repo = new EntityRepo()
  const resources = await fetchCollection(baseUrl, '/jsonapi/node/article', {
    include: [
      'field_content',
      'field_content.field_media',
      'field_content.field_media.field_media_image',
      'field_article_category',
      'field_article_type',
    ].join(','),
  })
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
async function loadFiles(baseUrl, repo) {
  const fileUuids = new Set()
  for (const media of repo.byType('media')) {
    const targetUuid = media.fields.field_media_image?.targetUuid
    if (targetUuid) fileUuids.add(targetUuid)
  }
  for (const uuid of fileUuids) {
    const res = await fetch(new URL(`/jsonapi/file/file/${uuid}`, baseUrl))
    if (!res.ok) {
      console.warn(`sync-content: could not fetch file ${uuid} (${res.status})`)
      continue
    }
    const { data } = await res.json()
    repo.add(normalizeResource(data))
  }
}

// ---------------------------------------------------------------------------
// Transform: entities -> articleEntries content collection shape
// ---------------------------------------------------------------------------

function slugify(title) {
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

    default:
      throw new Error(`No sync transform for paragraph bundle "${bundle}" (uuid ${uuid}) — add one in buildParagraph() before this can render.`)
  }
}

function flattenText(paragraph) {
  if (!paragraph) return []
  if (paragraph.type === 'text_formatted') return [paragraph.html.replace(/<[^>]+>/g, ' ')]
  if (paragraph.type === 'section') return Object.values(paragraph.regions).flat().flatMap(flattenText)
  return []
}

function buildArticle(repo, node) {
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
  const description = html(fields.field_description).replace(/<[^>]+>/g, '').trim()

  return {
    title,
    path: `/writing/${slugify(title)}`,
    date: (fields.field_published ?? fields.created ?? '').slice(0, 10),
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

  const repo = await loadArticles(args.baseUrl)
  await loadFiles(args.baseUrl, repo)

  const articles = repo.byType('node')
    .filter((node) => node.bundle === 'article')
    .map((node) => buildArticle(repo, node))
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  await writeArticles(articles, args)
  await copyMedia(repo, args)

  console.log(`sync-content: wrote ${articles.length} article(s) from ${args.baseUrl}`)
  for (const article of articles) {
    console.log(`  - ${article.path} (${article.paragraphs.length} top-level paragraphs, ${article.categories.join(', ')})`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
