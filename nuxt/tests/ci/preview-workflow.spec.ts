import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Guards the deploy trigger in `.github/workflows/preview.yml`.
 *
 * This workflow once ran on a push to `main`. Because the alias on a push is
 * the branch name, that deployed with `--alias=main`, and Netlify publishes an
 * alias matching the production branch AS production. A prebuilt 3-second
 * upload from Actions therefore replaced Netlify's own build of the same
 * commit. The site stayed up and served its full prerendered content, so this
 * was invisible from the outside, but for two days:
 *
 *   - GA4 recorded nothing, and that data is not recoverable. `CONTEXT` is only
 *     set by a Netlify build, so it was unset, making `gtag.enabled` false in
 *     nuxt.config. nuxt-gtag then swaps in its no-op mock, so nothing errored.
 *   - `/q/*` 404'd, so the QR codes on every share image led nowhere.
 *   - `/api/*` 404'd, which only degraded client-side refreshes over content
 *     that was already prerendered, leaving those sections showing build-time
 *     data.
 *
 * Read as text rather than parsed: this asserts the trigger and the in-job
 * guard are both present, and a string check needs no YAML dependency.
 */
const workflow = readFileSync(
  resolve(__dirname, '../../../.github/workflows/preview.yml'),
  'utf8',
)

/** The `on.push.branches` list, as authored. */
function pushBranches(): string {
  const m = workflow.match(/\n {2}push:\n {4}branches:\s*\[([^\]]*)\]/)
  if (!m) throw new Error('could not find on.push.branches in preview.yml')
  return m[1]!
}

describe('preview.yml deploy trigger', () => {
  it('does not run on a push to main, which Netlify would publish as production', () => {
    expect(pushBranches()).not.toMatch(/\bmain\b/)
  })

  it('still runs on a push to develop', () => {
    expect(pushBranches()).toMatch(/\bdevelop\b/)
  })

  it('still previews pull requests targeting main', () => {
    const m = workflow.match(/\n {2}pull_request:\n {4}branches:\s*\[([^\]]*)\]/)
    expect(m?.[1]).toMatch(/\bmain\b/)
  })

  it('refuses an alias of main even if the trigger is widened again', () => {
    // Belt and braces: the trigger is the fix, this is the backstop. If someone
    // re-adds main to `push:`, the job must fail loudly rather than silently
    // replace the production deploy.
    expect(workflow).toMatch(/if \[ "\$name" = "main" \]; then/)
    expect(workflow).toMatch(/::error::Refusing to deploy with --alias=main/)
  })

  it('never passes --prod in an actual command', () => {
    // Comments in this workflow discuss --prod at length, so strip them first:
    // an earlier version of this assertion failed on the prose rather than on
    // anything the job runs.
    const code = workflow
      .split('\n')
      .filter(line => !/^\s*#/.test(line))
      .join('\n')
    expect(code).not.toMatch(/--prod\b/)
  })
})
