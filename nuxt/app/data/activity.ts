export interface Activity {
  when: string
  repo: string
  action: string
}

export const activity: Activity[] = [
  { when: '2h', repo: 'druxt/druxt', action: 'pushed 3 commits to main' },
  { when: '1d', repo: 'druxt/druxt.io', action: 'released v0.30.0' },
  { when: '3d', repo: 'drupal/filefield_paths', action: 'reviewed patch #3471' },
  { when: '5d', repo: 'druxt/druxt-site', action: 'opened PR #214' },
  { when: '1w', repo: 'stuartclark/stuar.tc', action: 'pushed 7 commits' },
]
