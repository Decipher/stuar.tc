const { execSync } = require('node:child_process')

// Runs before Netlify's automatic pnpm install.
// @stuartclark/ui is a link:../../ui workspace dependency that only resolves
// when the sibling directory exists — clone it from the private GitHub mirror.
module.exports = {
  onPreInstall: ({ utils }) => {
    const raw = process.env.UI_REPO_TOKEN
    if (!raw) {
      utils.build.failBuild('UI_REPO_TOKEN is not set — add it in Site configuration → Environment variables')
      return
    }

    const token = raw.replace(/[\r\n]/g, '').replace(/^[\s"']+|[\s"']+$/g, '')

    console.log(`UI_REPO_TOKEN: raw length ${raw.length}, sanitized length ${token.length}`)
    if (/[^a-zA-Z0-9_-]/.test(token)) {
      console.warn('WARNING: sanitized token contains unexpected characters — likely mis-pasted')
    }

    const run = cmd => execSync(cmd, { stdio: 'inherit', shell: true })

    // base dir is nuxt/, so ../../ui lands outside the checkout — same path
    // that link:../../ui resolves to at install time.
    run('rm -rf ../../ui')
    run(`git clone "https://x-access-token:${token}@github.com/Decipher/sc-ui.git" ../../ui -b main`)
    run('corepack enable')
    run('cd ../../ui && pnpm install --frozen-lockfile && pnpm prepare')
  },
}
