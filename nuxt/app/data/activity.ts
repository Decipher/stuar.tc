/** One Heartbeat row. */
export interface Activity {
  /**
   * Label for the time column as rendered on the server: a short absolute
   * date ("Oct 23") for live rows, which is never wrong in a static build.
   * AppActivityFeed swaps in a relative age from `at` once mounted.
   */
  when: string
  /** ISO 8601 time of the activity. */
  at?: string
  repo: string
  verb: string
  rest: string
  /** Origin badge: "GH", "D.O" or "/DEV/NULL". */
  source: string
  href?: string
}

export const activity: Activity[] = [
  { when: '2h', repo: 'druxt/druxt', verb: 'pushed', rest: '3 times', source: 'GH' },
  { when: '1d', repo: 'druxt/druxt.io', verb: 'released', rest: 'v0.30.0', source: 'GH' },
  { when: '3d', repo: 'drupal/filefield_paths', verb: 'opened MR', rest: '', source: 'D.O' },
  { when: '5d', repo: 'druxt/druxt-site', verb: 'opened PR', rest: '#214', source: 'GH' },
  { when: '1w', repo: 'stuartclark/stuar.tc', verb: 'pushed', rest: '7 times', source: 'GH' },
]
