export interface UseGroup {
  group: string
  items: { name: string; detail: string }[]
}

export const uses: UseGroup[] = [
  { group: 'Editor & terminal', items: [{ name: 'VS Code', detail: 'Vim keybindings' }, { name: 'iTerm2 + zsh', detail: 'starship prompt' }, { name: 'GitHub Copilot', detail: 'pair, not autopilot' }] },
  { group: 'Local dev', items: [{ name: 'DDEV', detail: 'dockerised Drupal' }, { name: 'Node + pnpm', detail: 'Nuxt front-ends' }, { name: 'Lefthook', detail: 'git hooks' }] },
  { group: 'Desktop', items: [{ name: 'Raycast', detail: 'launcher' }, { name: 'Figma', detail: 'design handoff' }, { name: 'Obsidian', detail: 'notes & drafts' }] },
  { group: 'Hardware', items: [{ name: 'MacBook Pro 16"', detail: 'Apple silicon' }, { name: 'LG UltraFine 4K', detail: '27 inch' }, { name: 'DJI drone', detail: 'aerial work' }] },
  { group: 'Drupal stack', items: [{ name: 'Drupal 10 / 11', detail: 'core' }, { name: 'DruxtJS + Nuxt', detail: 'decoupled front end' }, { name: 'JSON:API', detail: 'data layer' }] },
  { group: 'Services', items: [{ name: 'GitHub Actions', detail: 'CI' }, { name: 'Platform.sh', detail: 'hosting' }, { name: 'Fathom', detail: 'analytics' }] },
]
