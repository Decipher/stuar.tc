#!/usr/bin/env node
// Pushes a Nuxt-authored article JSON into Drupal via JSON:API — the
// reverse of sync-content.mjs. Reads an articles-data JSON file, resolves
// or creates taxonomy terms, builds the paragraph tree bottom-up (children
// before the section parent), then creates/updates the node--article.
//
// Authentication: Simple OAuth client_credentials grant (see the
// run-drupal-push-story.sh helper for local setup).
//
// Usage:
//   node scripts/push-story.mjs \
//     --base-url=http://127.0.0.1:8888 \
//     --file=../content/articles-data/field-tokens-200-20260722.json \
//     --client-id=xxx --client-secret=yyy

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DruxtClient } from 'druxt'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEFAULTS = {
  baseUrl: 'http://127.0.0.1:8888',
  file: path.join(__dirname, '../content/articles-data/field-tokens-200-20260722.json'),
  clientId: '',
  clientSecret: '',
}

/**
 * Parse --key=value CLI args into an options object (camelCased keys).
 *
 * @param {string[]} argv - The argv slice (usually process.argv.slice(2)).
 * @returns {Record<string, string>} Parsed options merged with defaults.
 */
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
// OAuth
// ---------------------------------------------------------------------------

/**
 * Request a bearer token via Simple OAuth's client_credentials grant.
 *
 * @param {string} baseUrl - The Drupal base URL.
 * @param {string} clientId - The Consumer client ID.
 * @param {string} clientSecret - The Consumer client secret.
 * @returns {Promise<string>} The access token.
 * @throws {Error} If the token endpoint returns a non-OK response.
 */
async function getToken(baseUrl, clientId, clientSecret) {
  const res = await fetch(`${baseUrl}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })
  if (!res.ok) {
    throw new Error(`OAuth token request failed (${res.status}): ${await res.text()}`)
  }
  const body = await res.json()
  return body.access_token
}

// ---------------------------------------------------------------------------
// Taxonomy helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a taxonomy term by name within a vocabulary, creating it if missing.
 *
 * @param {DruxtClient} druxt - Authenticated DruxtClient instance.
 * @param {string} vocabulary - The vocabulary machine name (e.g. "article_category").
 * @param {string} name - The term name to find or create.
 * @returns {Promise<string>} The term UUID.
 * @throws {Error} If collection fetch or creation fails.
 */
async function resolveTerm(druxt, vocabulary, name) {
  const body = await druxt.getCollection(`taxonomy_term--${vocabulary}`, {
    'filter[name]': name,
  })
  const existing = body.data?.[0]
  if (existing) {
    console.log(`push-story: found existing ${vocabulary} term "${name}" (${existing.id})`)
    return existing.id
  }

  console.log(`push-story: creating ${vocabulary} term "${name}"`)
  const resp = await druxt.createResource({
    type: `taxonomy_term--${vocabulary}`,
    attributes: { name },
  })
  return resp.data.data.id
}

// ---------------------------------------------------------------------------
// Paragraph builders
// ---------------------------------------------------------------------------

/**
 * Build a JSON:API resource object for a paragraph from its Nuxt JSON shape.
 *
 * @param {object} paragraph - The paragraph in Nuxt articles-data shape.
 * @param {string|null} sectionUuid - The parent section UUID (null for the
 *   section itself, a UUID for its children).
 * @returns {{type: string, attributes: object}} The JSON:API resource object.
 * @throws {Error} For unsupported paragraph types.
 */
function buildParagraphResource(paragraph, sectionUuid) {
  const isSection = paragraph.type === 'section'
  const behaviorSettings = isSection
    ? {
        layout_paragraphs: {
          layout: paragraph.layout ?? 'layout_onecol',
          config: { label: '' },
          parent_uuid: null,
          region: null,
        },
      }
    : {
        layout_paragraphs: {
          parent_uuid: sectionUuid,
          region: 'content',
        },
      }

  const attributes = { behavior_settings: { value: behaviorSettings } }

  switch (paragraph.type) {
    case 'section':
      // Section paragraphs carry only layout metadata (already in
      // behavior_settings above) and an optional title — no body fields.
      if (paragraph.title) attributes.field_title = paragraph.title
      break

    case 'text_formatted':
      attributes.field_text_formatted = {
        value: paragraph.html,
        format: 'formatted',
      }
      break

    case 'code':
      if (paragraph.title) attributes.field_title = paragraph.title
      attributes.field_code = paragraph.code
      break

    case 'repository':
      attributes.field_description = {
        value: paragraph.description,
        format: 'formatted',
      }
      attributes.field_url = { uri: paragraph.url, title: '', options: [] }
      attributes.field_gitpod = Boolean(paragraph.gitpod)
      if (paragraph.drupalUrl) {
        attributes.field_drupal_url = { uri: paragraph.drupalUrl, title: '', options: [] }
      }
      break

    default:
      throw new Error(`Unsupported paragraph type: ${paragraph.type}`)
  }

  return { type: `paragraph--${paragraph.type}`, attributes }
}

/**
 * Create all paragraphs for an article: the section first, then each child,
 * capturing UUIDs and revision IDs from each response.
 *
 * Layout Paragraphs tracks the parent-child relationship on the CHILD (via
 * behavior_settings.layout_paragraphs.parent_uuid), so the section must be
 * created first so its UUID is available when building children.
 *
 * @param {DruxtClient} druxt - Authenticated DruxtClient instance.
 * @param {object[]} sectionParagraphs - Top-level paragraph entries from the
 *   article JSON (expected: exactly one section).
 * @returns {Promise<{data: {type: string, id: string, meta: {target_revision_id: number}}[]}>}
 *   The field_content relationship array for the node.
 */
async function createParagraphs(druxt, sectionParagraphs) {
  const fieldContent = []

  for (const sectionPara of sectionParagraphs) {
    if (sectionPara.type !== 'section') {
      throw new Error(`Expected a section paragraph at top level, got "${sectionPara.type}"`)
    }

    // Create the section paragraph.
    console.log(`push-story: creating section paragraph (layout: ${sectionPara.layout})`)
    const sectionResp = await druxt.createResource(
      buildParagraphResource(sectionPara, null),
    )
    const sectionCreated = sectionResp.data.data
    const sectionUuid = sectionCreated.id
    const sectionRevId = sectionCreated.attributes?.drupal_internal__revision_id
    fieldContent.push({
      type: 'paragraph--section',
      id: sectionUuid,
      meta: { target_revision_id: sectionRevId },
    })

    // Create each child paragraph inside the section.
    const children = sectionPara.regions?.content ?? []
    for (const child of children) {
      console.log(`push-story:   creating ${child.type} paragraph`)
      const childResp = await druxt.createResource(
        buildParagraphResource(child, sectionUuid),
      )
      const childCreated = childResp.data.data
      fieldContent.push({
        type: `paragraph--${child.type}`,
        id: childCreated.id,
        meta: {
          target_revision_id: childCreated.attributes?.drupal_internal__revision_id,
        },
      })
    }
  }

  return fieldContent
}

// ---------------------------------------------------------------------------
// Node builder
// ---------------------------------------------------------------------------

/**
 * Extract a `created` date (ISO 8601) from the article's path suffix so the
 * pathauto pattern `[node:title]-[node:created:custom:Ymd]` reproduces the
 * exact same alias.
 *
 * @param {string} articlePath - The article path (e.g. "/writing/field-tokens-200-20260722").
 * @returns {string} ISO 8601 timestamp derived from the trailing Ymd date.
 */
function extractCreatedFromPath(articlePath) {
  const match = /(\d{4})(\d{2})(\d{2})$/.exec(articlePath)
  if (!match) return new Date().toISOString()
  const [, year, month, day] = match
  return `${year}-${month}-${day}T00:00:00+00:00`
}

/**
 * Build the JSON:API node--article resource object from the article JSON
 * and resolved paragraph/term references.
 *
 * @param {object} article - The Nuxt articles-data JSON object.
 * @param {object} fieldContent - The field_content relationship data array.
 * @param {string} typeUuid - The article_type taxonomy term UUID.
 * @param {string[]} categoryUuids - The article_category taxonomy term UUIDs.
 * @returns {object} The JSON:API resource object for node--article.
 */
function buildNodeResource(article, fieldContent, typeUuid, categoryUuids) {
  return {
    type: 'node--article',
    attributes: {
      title: article.title,
      field_display_title: article.title,
      field_description: article.description,
      field_published: article.date,
      created: extractCreatedFromPath(article.path),
      status: true,
    },
    relationships: {
      field_article_type: {
        data: { type: 'taxonomy_term--article_type', id: typeUuid },
      },
      field_article_category: {
        data: categoryUuids.map((uuid) => ({
          type: 'taxonomy_term--article_category',
          id: uuid,
        })),
      },
      field_content: { data: fieldContent },
    },
  }
}

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (!args.clientId || !args.clientSecret) {
    console.error('push-story: --client-id and --client-secret are required')
    process.exit(1)
  }

  // Read the article JSON.
  const articlePath = path.resolve(args.file)
  console.log(`push-story: reading ${articlePath}`)
  const article = JSON.parse(await readFile(articlePath, 'utf8'))

  // Authenticate via Simple OAuth.
  console.log(`push-story: authenticating to ${args.baseUrl}`)
  const token = await getToken(args.baseUrl, args.clientId, args.clientSecret)
  const druxt = new DruxtClient(args.baseUrl)
  druxt.addHeaders({ Authorization: `Bearer ${token}` })

  // Resolve taxonomy terms (create if missing).
  console.log(`push-story: resolving taxonomy terms`)
  const typeUuid = await resolveTerm(druxt, 'article_type', article.articleType)
  const categoryUuids = await Promise.all(
    (article.categories ?? []).map((cat) => resolveTerm(druxt, 'article_category', cat)),
  )

  // Build paragraphs bottom-up.
  console.log(`push-story: creating paragraph tree`)
  const fieldContent = await createParagraphs(druxt, article.paragraphs)
  console.log(`push-story: created ${fieldContent.length} paragraph(s)`)

  // Upsert: look up existing node by field_display_title.
  const existing = await druxt.getCollection('node--article', {
    'filter[field_display_title]': article.title,
  })
  const existingNode = existing.data?.[0]

  const nodeResource = buildNodeResource(article, fieldContent, typeUuid, categoryUuids)

  if (existingNode) {
    console.log(`push-story: updating existing node ${existingNode.id}`)
    nodeResource.id = existingNode.id
    await druxt.updateResource(nodeResource)
    console.log(`push-story: updated "${article.title}" → ${article.path}`)
  } else {
    console.log(`push-story: creating new node`)
    const resp = await druxt.createResource(nodeResource)
    console.log(`push-story: created "${article.title}" → ${article.path} (node ${resp.data.data.id})`)
  }

  console.log('push-story: done')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
