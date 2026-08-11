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
//     --client-id=xxx --client-secret=yyy \
//     [--node-uuid=xxx]  # update this node instead of matching by title

import { execFileSync } from 'node:child_process'
import { readFile, unlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DruxtClient } from 'druxt'

/** Authorization header value for raw fetch calls (binary file uploads). */
let authToken = ''

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEFAULTS = {
  baseUrl: 'http://127.0.0.1:8888',
  file: path.join(__dirname, '../content/articles-data/field-tokens-200-20260722.json'),
  clientId: '',
  clientSecret: '',
  scope: process.env.STORY_SYNC_SCOPE || '',
  // Upsert normally matches the existing node by field_display_title, which
  // breaks once a draft's title has been edited since the node was first
  // created — pass the known node UUID explicitly to update in place instead.
  nodeUuid: '',
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
 * @param {string} [scope] - Optional OAuth scope (required by Simple OAuth 6.x).
 * @returns {Promise<string>} The access token.
 * @throws {Error} If the token endpoint returns a non-OK response.
 */
async function getToken(baseUrl, clientId, clientSecret, scope) {
  const params = {
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  }
  if (scope) {
    params.scope = scope
  }
  const res = await fetch(`${baseUrl}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
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
// File upload + media helpers
// ---------------------------------------------------------------------------

/**
 * Upload a binary file to Drupal via the JSON:API binary upload protocol.
 *
 * @param {string} baseUrl - The Drupal base URL.
 * @param {string} localPath - Absolute path to the file on disk.
 * @param {string} fileName - Desired filename in Drupal (e.g. "screenshot.png").
 * @returns {Promise<string>} The created file entity UUID.
 * @throws {Error} If the upload request fails.
 */
async function uploadFile(baseUrl, localPath, fileName) {
  const fileBuffer = await readFile(localPath)
  const res = await fetch(
    `${baseUrl}/jsonapi/media/image/field_media_image`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `file; filename="${fileName}"`,
      },
      body: fileBuffer,
    },
  )
  if (!res.ok) {
    throw new Error(`File upload failed (${res.status}): ${await res.text()}`)
  }
  const body = await res.json()
  return body.data.id
}

/**
 * Create a media--image entity with an uploaded file, alt text, and caption.
 *
 * @param {DruxtClient} druxt - Authenticated DruxtClient instance.
 * @param {string} fileUuid - The uploaded file entity UUID.
 * @param {string} alt - Alt text for the image.
 * @param {string} [caption] - Optional caption (plain text, wrapped in <p>).
 * @param {number} [width] - Image width in pixels.
 * @param {number} [height] - Image height in pixels.
 * @returns {Promise<string>} The created media entity UUID.
 */
async function createMediaImage(druxt, fileUuid, alt, caption, width, height) {
  const name = alt.length > 128 ? alt.slice(0, 125) + '...' : alt
  const attributes = { name }
  if (caption) {
    attributes.field_media_caption = { value: `<p>${caption}</p>`, format: 'formatted' }
  }
  const resource = {
    type: 'media--image',
    attributes,
    relationships: {
      field_media_image: {
        data: {
          type: 'file--file',
          id: fileUuid,
          meta: {
            alt,
            ...(width ? { width } : {}),
            ...(height ? { height } : {}),
          },
        },
      },
    },
  }
  const resp = await druxt.createResource(resource)
  return resp.data.data.id
}

/**
 * Build a paragraph--media resource that references a media--image entity.
 *
 * @param {string} mediaUuid - The media entity UUID.
 * @returns {{type: string, relationships: object}} JSON:API resource object.
 */
function buildMediaParagraph(mediaUuid) {
  return {
    type: 'paragraph--media',
    relationships: {
      field_media: { data: { type: 'media--image', id: mediaUuid } },
    },
  }
}

// ---------------------------------------------------------------------------
// Card link resolution
// ---------------------------------------------------------------------------

/**
 * Escape a string for embedding inside a PHP single-quoted string literal.
 *
 * @param {string} value
 * @returns {string}
 */
function phpQuote(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

/**
 * Run a PHP snippet via `drush php-eval`, from the current working
 * directory (expected to be the `drupal/` docroot's parent, as set up by
 * run-drupal-push-story.sh). Used where JSON:API can't do the job — see
 * call sites for why in each case.
 *
 * @param {string} php
 * @returns {string} Trimmed stdout.
 */
function execDrushPhp(php) {
  return execFileSync('vendor/bin/drush', ['php-eval', php], { encoding: 'utf8' }).trim()
}

/**
 * Find or create a `linky--linky` entity for an external URL. `field_link`
 * (on card and link paragraphs) is a dynamic_entity_reference, which needs
 * an actual entity to point at — Drupal core Link fields can't be
 * referenced directly, so external URLs get wrapped in a Linky module
 * entity (its `link` field holds uri/title/options; confirmed against a
 * real existing linky.*.json — the Linky module's own rich-text-link
 * auto-tracking creates these the same shape, just via a different path).
 *
 * Creation goes through drush, not JSON:API: the linkychecker module adds a
 * required `http_method` base field to `linky--linky` that's only ever
 * populated later by its own cron crawler (real committed linky entities
 * all have it empty at creation — confirmed against existing linky.*.json).
 * JSON:API validates the entity fully before saving and rejects the create
 * with "http_method: This value should not be null", whereas Linky's own
 * internal creation path (and a plain PHP ->save()) does not run that
 * validation.
 *
 * @param {DruxtClient} druxt - Authenticated DruxtClient instance.
 * @param {string} href - The external URL.
 * @param {string} [label] - Link text, stored as the Link field's title.
 * @returns {Promise<{type: string, id: string}>} Relationship data.
 */
async function resolveOrCreateLinky(druxt, href, label) {
  try {
    const body = await druxt.getCollection('linky--linky', {
      'filter[link.uri]': href,
    })
    const existing = body.data?.[0]
    if (existing) {
      console.log(`push-story: found existing linky for "${href}" (${existing.id})`)
      return { type: 'linky--linky', id: existing.id }
    }
  } catch {
    // Filter may be unsupported on this field; fall through to create.
  }
  console.log(`push-story: creating linky for "${href}"`)
  const php = `
$linky = \\Drupal\\linky\\Entity\\Linky::create([
  'link' => ['uri' => '${phpQuote(href)}', 'title' => '${phpQuote(label || '')}', 'options' => []],
]);
$linky->save();
echo $linky->uuid();
`
  const uuid = execDrushPhp(php)
  return { type: 'linky--linky', id: uuid }
}

/**
 * Resolve a card/link paragraph's `field_link` href to a JSON:API
 * relationship target. Internal paths like
 * "/writing/field-tokens-200-20260722" are resolved to the matching
 * node--article UUID via the path alias. Anything else is treated as an
 * external URL and resolved (or created) as a linky--linky entity.
 *
 * @param {DruxtClient} druxt - Authenticated DruxtClient instance.
 * @param {{href: string, label: string}} [link] - The link from article JSON.
 * @returns {Promise<{type: string, id: string}|null>} Relationship data or null.
 */
async function resolveFieldLink(druxt, link) {
  if (!link?.href) return null

  // Internal article links: resolve via path_alias entity, then node.
  if (link.href.startsWith('/writing/')) {
    try {
      const aliasBody = await druxt.getCollection('path_alias--path_alias', {
        'filter[alias]': link.href,
      })
      const alias = aliasBody.data?.[0]
      if (alias) {
        // alias.attributes.path is "/node/N" - extract the internal path.
        const internalPath = alias.attributes?.path || alias.attributes?.alias
        const nodeMatch = /\/node\/(\d+)/.exec(internalPath || '')
        if (nodeMatch) {
          const nodeBody = await druxt.getCollection('node--article', {
            'filter[drupal_internal__nid]': nodeMatch[1],
          })
          if (nodeBody.data?.[0]) {
            return { type: 'node--article', id: nodeBody.data[0].id, meta: { target_type: 'node' } }
          }
        }
      }
    } catch {
      // Path alias lookup may fail if module config differs; fall through.
    }

    // Fallback: match by title extracted from the link label.
    const label = link.label?.replace(/^Read the /, '').replace(/ post$/, '')
    if (label) {
      try {
        const byTitle = await druxt.getCollection('node--article', {
          'filter[field_display_title]': label,
        })
        if (byTitle.data?.[0]) {
          return { type: 'node--article', id: byTitle.data[0].id, meta: { target_type: 'node' } }
        }
      } catch {
        // Give up silently if title lookup also fails.
      }
    }

    return null
  }

  // External URL: find or create a linky entity to point at.
  return resolveOrCreateLinky(druxt, link.href, link.label)
}

/**
 * Build a JSON:API resource object for a paragraph from its Nuxt JSON shape.
 *
 * Deliberately does not touch behavior_settings — see
 * applyLayoutParagraphsSettings() for why that has to happen out-of-band via
 * drush after creation, not in this JSON:API payload.
 *
 * @param {object} paragraph - The paragraph in Nuxt articles-data shape.
 * @returns {{type: string, attributes: object}} The JSON:API resource object.
 * @throws {Error} For unsupported paragraph types.
 */
function buildParagraphResource(paragraph) {
  const attributes = {}

  switch (paragraph.type) {
    case 'section':
      // Section paragraphs carry only an optional title — no body fields.
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

    case 'card':
      if (paragraph.title) attributes.field_title = paragraph.title
      if (paragraph.description) {
        attributes.field_text_formatted = {
          value: paragraph.description,
          format: 'formatted',
        }
      }
      break

    case 'jumbotron':
      // field_content (its nested paragraphs) is set by the caller once
      // those children exist — see createChildParagraph()'s 'jumbotron'
      // branch below.
      if (paragraph.title) attributes.field_title = paragraph.title
      break

    case 'link':
      // field_link is a relationship, resolved async — set by the caller,
      // same reason as jumbotron above.
      break

    default:
      throw new Error(`Unsupported paragraph type: ${paragraph.type}`)
  }

  return { type: `paragraph--${paragraph.type}`, attributes }
}

/**
 * Create a single non-section paragraph (any type, including a nested
 * jumbotron's own children) and return its field_content relationship
 * entry. Recurses for jumbotron, whose nested paragraphs are created
 * first so its own field_content can reference them.
 *
 * @param {DruxtClient} druxt - Authenticated DruxtClient instance.
 * @param {string} baseUrl - The Drupal base URL (for file uploads).
 * @param {string} nuxtPublicDir - Absolute path to nuxt/public (media source files).
 * @param {object} child - The paragraph in Nuxt articles-data shape.
 * @param {string|null} parentUuid - The enclosing section's UUID, or null
 *   for a jumbotron's own nested children (they nest via the jumbotron's own
 *   field_content relationship, not Layout Paragraphs regions).
 * @param {Record<string, string>} parentByUuid - Accumulator this function
 *   populates with `{[createdUuid]: parentUuid}` for every paragraph that
 *   has a parent, consumed afterwards by applyLayoutParagraphsSettings().
 * @param {Record<string, {type: string, id: string}>} fieldLinkByUuid -
 *   Accumulator populated with `{[createdUuid]: linkTarget}` for card/link
 *   paragraphs with a resolved link, consumed afterwards by
 *   applyFieldLinkSettings().
 * @returns {Promise<{type: string, id: string, meta: {target_revision_id: number}}>}
 */
async function createChildParagraph(druxt, baseUrl, nuxtPublicDir, child, parentUuid, parentByUuid, fieldLinkByUuid) {
  let childResource
  let linkTarget = null

  if (child.type === 'media') {
    // Media paragraphs need file upload + media entity creation.
    const filePath = path.join(nuxtPublicDir, child.src)
    const fileName = path.basename(child.src)
    console.log(`push-story:     uploading ${fileName}`)
    const fileUuid = await uploadFile(baseUrl, filePath, fileName)
    const mediaUuid = await createMediaImage(
      druxt, fileUuid, child.alt, child.caption, child.width, child.height,
    )
    childResource = buildMediaParagraph(mediaUuid)
  } else if (child.type === 'card' || child.type === 'link') {
    // Card and link paragraphs both resolve field_link the same way. Applied
    // afterwards via applyFieldLinkSettings() — see its docstring for why.
    childResource = buildParagraphResource(child)
    linkTarget = await resolveFieldLink(druxt, child.link)
  } else if (child.type === 'jumbotron') {
    // Create the jumbotron's own nested paragraphs first (no parent_uuid —
    // they nest via the jumbotron's field_content relationship, not Layout
    // Paragraphs regions), then the jumbotron itself referencing them.
    const nestedContent = []
    for (const nested of child.content ?? []) {
      console.log(`push-story:     creating nested ${nested.type} paragraph (jumbotron)`)
      nestedContent.push(
        await createChildParagraph(druxt, baseUrl, nuxtPublicDir, nested, null, parentByUuid, fieldLinkByUuid),
      )
    }
    childResource = buildParagraphResource(child)
    childResource.relationships = {
      ...childResource.relationships,
      field_content: { data: nestedContent },
    }
  } else {
    childResource = buildParagraphResource(child)
  }

  const childResp = await druxt.createResource(childResource)
  const childCreated = childResp.data.data
  if (parentUuid) {
    parentByUuid[childCreated.id] = parentUuid
  }
  if (linkTarget) {
    fieldLinkByUuid[childCreated.id] = linkTarget
  }
  return {
    type: `paragraph--${child.type}`,
    id: childCreated.id,
    meta: {
      target_revision_id: childCreated.attributes?.drupal_internal__revision_id,
    },
  }
}

/**
 * Set behavior_settings.layout_paragraphs on already-created paragraphs via
 * `drush php-eval`, using Paragraph::setBehaviorSettings() + save().
 *
 * behavior_settings is a `string_long` base field holding a PHP-serialize()d
 * array; Drupal's core entity serializer (used by Tome) transparently packs
 * /unpacks it via the paragraph entity type's serialized_field_property_names
 * declaration, but JSON:API's FieldItemNormalizer picks its per-property
 * denormalizer purely by target class (ignoring the shape of the incoming
 * data — see Drupal\jsonapi\Normalizer\FieldItemNormalizer::denormalize()),
 * so there is no JSON:API request body that sets this field correctly: a
 * plain object fails entity validation ("This value should be of the correct
 * primitive type"), and a pre-serialized string is explicitly rejected by
 * SerializedColumnNormalizerTrait::checkForSerializedStrings(). Setting it
 * via Drupal's own PHP API sidesteps that gap entirely.
 *
 * @param {Record<string, string>} parentByUuid - `{[paragraphUuid]: parentSectionUuid}`.
 * @returns {Promise<void>}
 */
async function applyLayoutParagraphsSettings(parentByUuid) {
  const entries = Object.entries(parentByUuid)
  if (entries.length === 0) return

  console.log(`push-story: applying Layout Paragraphs settings to ${entries.length} paragraphs via drush`)
  const manifestPath = path.join(os.tmpdir(), `push-story-behavior-settings-${Date.now()}.json`)
  await writeFile(manifestPath, JSON.stringify(Object.fromEntries(entries)))

  const php = `
$map = json_decode(file_get_contents('${manifestPath}'), TRUE);
$storage = \\Drupal::entityTypeManager()->getStorage('paragraph');
$missing = [];
foreach ($map as $uuid => $parentUuid) {
  $paragraphs = $storage->loadByProperties(['uuid' => $uuid]);
  $paragraph = reset($paragraphs);
  if (!$paragraph) {
    $missing[] = $uuid;
    continue;
  }
  $paragraph->setBehaviorSettings('layout_paragraphs', ['parent_uuid' => $parentUuid, 'region' => 'content']);
  $paragraph->save();
}
if ($missing) {
  fwrite(STDERR, 'push-story: WARNING paragraphs not found: ' . implode(', ', $missing) . PHP_EOL);
}
echo 'push-story: behavior_settings applied to ' . (count($map) - count($missing)) . ' paragraphs' . PHP_EOL;
`

  try {
    execFileSync('vendor/bin/drush', ['php-eval', php], { stdio: 'inherit' })
  } finally {
    await unlink(manifestPath).catch(() => {})
  }
}

/**
 * Set field_link on already-created card/link paragraphs via `drush
 * php-eval`.
 *
 * field_link is a dynamic_entity_reference field (can point at either
 * node--article or linky--linky), which needs a per-item target_type
 * alongside target_id — but JSON:API's relationship denormalization only
 * ever resolves the referenced entity down to a bare `target_id`, dropping
 * target_type entirely (confirmed by instrumenting
 * DynamicEntityReferenceItem::setValue() locally: it received only
 * `['target_id' => '29']`). That's fine for an ordinary entity_reference
 * field, whose target_type is fixed by field config, but
 * DynamicEntityReferenceItem::setValue() requires target_type explicitly
 * per item and throws "No entity type was provided, value is not a valid
 * entity." without it. Same root cause and same workaround as
 * applyLayoutParagraphsSettings() above: set it via Drupal's own PHP API,
 * which accepts target_type + target_id directly.
 *
 * @param {Record<string, {type: string, id: string}>} fieldLinkByUuid -
 *   `{[paragraphUuid]: {type: 'node--article'|'linky--linky', id: targetUuid}}`.
 * @returns {Promise<void>}
 */
async function applyFieldLinkSettings(fieldLinkByUuid) {
  const entries = Object.entries(fieldLinkByUuid)
  if (entries.length === 0) return

  console.log(`push-story: applying field_link to ${entries.length} paragraphs via drush`)
  const manifestPath = path.join(os.tmpdir(), `push-story-field-link-${Date.now()}.json`)
  await writeFile(manifestPath, JSON.stringify(Object.fromEntries(entries)))

  const php = `
$map = json_decode(file_get_contents('${manifestPath}'), TRUE);
$paragraphStorage = \\Drupal::entityTypeManager()->getStorage('paragraph');
$repository = \\Drupal::service('entity.repository');
$missing = [];
foreach ($map as $uuid => $target) {
  $paragraphs = $paragraphStorage->loadByProperties(['uuid' => $uuid]);
  $paragraph = reset($paragraphs);
  if (!$paragraph) {
    $missing[] = $uuid;
    continue;
  }
  $targetType = explode('--', $target['type'])[0];
  $targetEntity = $repository->loadEntityByUuid($targetType, $target['id']);
  if (!$targetEntity) {
    $missing[] = $uuid . ' (target ' . $target['type'] . ':' . $target['id'] . ' not found)';
    continue;
  }
  $paragraph->set('field_link', ['target_type' => $targetType, 'target_id' => $targetEntity->id()]);
  $paragraph->save();
}
if ($missing) {
  fwrite(STDERR, 'push-story: WARNING field_link targets not found: ' . implode(', ', $missing) . PHP_EOL);
}
echo 'push-story: field_link applied to ' . (count($map) - count($missing)) . ' paragraphs' . PHP_EOL;
`

  try {
    execFileSync('vendor/bin/drush', ['php-eval', php], { stdio: 'inherit' })
  } finally {
    await unlink(manifestPath).catch(() => {})
  }
}

/**
 * Create all paragraphs for an article: the section first, then each child,
 * capturing UUIDs and revision IDs from each response. Layout Paragraphs'
 * parent/region grouping is applied afterwards via
 * applyLayoutParagraphsSettings() rather than in the creation payload.
 *
 * @param {DruxtClient} druxt - Authenticated DruxtClient instance.
 * @param {object[]} sectionParagraphs - Top-level paragraph entries from the
 *   article JSON (expected: exactly one section).
 * @param {string} baseUrl - The Drupal base URL (for file uploads).
 * @returns {Promise<{data: {type: string, id: string, meta: {target_revision_id: number}}[]}>}
 *   The field_content relationship array for the node.
 */
async function createParagraphs(druxt, sectionParagraphs, baseUrl) {
  const fieldContent = []
  const nuxtPublicDir = path.join(__dirname, '..', 'public')
  const parentByUuid = {}
  const fieldLinkByUuid = {}

  for (const sectionPara of sectionParagraphs) {
    if (sectionPara.type !== 'section') {
      throw new Error(`Expected a section paragraph at top level, got "${sectionPara.type}"`)
    }

    // Create the section paragraph.
    console.log(`push-story: creating section paragraph (layout: ${sectionPara.layout})`)
    const sectionResp = await druxt.createResource(
      buildParagraphResource(sectionPara),
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
      fieldContent.push(
        await createChildParagraph(druxt, baseUrl, nuxtPublicDir, child, sectionUuid, parentByUuid, fieldLinkByUuid),
      )
    }
  }

  await applyLayoutParagraphsSettings(parentByUuid)
  await applyFieldLinkSettings(fieldLinkByUuid)

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
  const token = await getToken(args.baseUrl, args.clientId, args.clientSecret, args.scope)
  authToken = token
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
  const fieldContent = await createParagraphs(druxt, article.paragraphs, args.baseUrl)
  console.log(`push-story: created ${fieldContent.length} paragraph(s)`)

  // Upsert: prefer an explicit --node-uuid override (see DEFAULTS.nodeUuid
  // for why), otherwise look up the existing node by field_display_title.
  let existingNode = args.nodeUuid ? { id: args.nodeUuid } : null
  if (!existingNode) {
    const existing = await druxt.getCollection('node--article', {
      'filter[field_display_title]': article.title,
    })
    existingNode = existing.data?.[0]
  }

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
