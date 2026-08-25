#!/usr/bin/env node
// Pulls hand-authored prose out of nuxt/content/articles-data/*.json into
// plain .html files under .vale-extracted/, so Vale (which understands
// markdown/HTML, not our JSON paragraph schema) has something sane to lint.
// Only the strings a person actually wrote: title, description, and every
// text_formatted/code(title)/repository(description) paragraph. Skips
// media alt text and card/link labels - short, structural, not prose.
//
// Lives at the repo root (not nuxt/) alongside .vale.ini, because Vale is
// meant to cover more than just the synced nuxt articles eventually -
// drupal/content (Tome-exported node content) is the canonical source these
// are synced from, and should read the same once there's something there to
// extract from. Output is source-prefixed (`nuxt-<slug>.html`) so a future
// drupal/content extraction pass can write alongside these without clashing.
import { readdir, readFile, writeFile, rm, mkdir } from 'node:fs/promises'
import { join, basename } from 'node:path'

const SOURCE_DIR = join(import.meta.dirname, '../nuxt/content/articles-data')
const OUTPUT_DIR = join(import.meta.dirname, '../.vale-extracted')

function collectProse(paragraphs, out) {
  for (const p of paragraphs) {
    if (p.type === 'text_formatted') out.push(p.html)
    else if (p.type === 'code' && p.title) out.push(`<p>${p.title}</p>`)
    else if (p.type === 'repository') out.push(p.description)
    else if (p.type === 'card' && p.description) out.push(p.description)
    else if (p.type === 'section' || p.type === 'jumbotron') {
      const regions = p.regions ? Object.values(p.regions).flat() : (p.content ?? [])
      collectProse(regions, out)
    }
    else if (p.type === 'card_group') {
      for (const c of p.cards) if (c.description) out.push(c.description)
    }
  }
}

async function main() {
  await rm(OUTPUT_DIR, { recursive: true, force: true })
  await mkdir(OUTPUT_DIR, { recursive: true })

  const files = (await readdir(SOURCE_DIR)).filter(f => f.endsWith('.json'))
  for (const file of files) {
    const article = JSON.parse(await readFile(join(SOURCE_DIR, file), 'utf8'))
    const prose = [`<p>${article.title}</p>`, `<p>${article.description}</p>`]
    collectProse(article.paragraphs ?? [], prose)
    const outFile = join(OUTPUT_DIR, `nuxt-${basename(file, '.json')}.html`)
    await writeFile(outFile, prose.join('\n\n'))
  }

  console.log(`Extracted prose from ${files.length} article(s) to ${OUTPUT_DIR}`)
}

main().catch((err) => { console.error(err.stack || err.message); process.exit(1) })
