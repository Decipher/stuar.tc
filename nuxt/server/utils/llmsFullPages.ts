/**
 * The site's own pages, as documents for ``/llms-full.txt``.
 *
 * Articles are synced content; these pages are not. They are Vue templates
 * assembled from ``app/data`` plus a little inline prose, and much of what they
 * show is fetched live in the browser. Rendering them to HTML and converting
 * that would publish buttons, filter controls and a build-time snapshot of the
 * activity feed, so they are built here from the same data instead.
 *
 * Two pages are left out on purpose. Home and ``/writing`` summarise what the
 * file already holds in full: the articles, and the projects listed below.
 */

import { site } from '~/data/site'
import { stats } from '~/data/stats'
import { expertise } from '~/data/expertise'
import { modules } from '~/data/modules'
import { coMaintainedMachineNames } from '~/data/co-maintained'
import { talks } from '~/data/talks'
import { drupalcons } from '~/data/drupalcons'
import { organizerRoles } from '~/data/community'

/** One page, in the shape ``llmsFullTxt`` renders every document. */
export interface PageDocument {
  path: string
  title: string
  description: string
  /** Markdown blocks, in reading order. */
  body: string[]
}

/**
 * Prose written inline in the page templates, copied as rendered.
 *
 * Duplicated rather than shared, because moving it into data would mean
 * rebuilding the templates' inline emphasis. ``tests/pages/pages.spec.ts``
 * mounts each page and fails if any of these stops appearing on it.
 */
export const PAGE_PROSE = {
  about: {
    description: 'Senior Drupal & JavaScript engineer in Ballarat, Australia. Creator of DruxtJS. 24+ years on the web, ~20 in Drupal.',
    bio: [
      'I build decoupled Drupal systems. APIs, frameworks, and the front-ends that consume them. I want the gap between Drupal and JavaScript to feel like it isn’t there.',
      'In 2019 I created DruxtJS, a framework that maps Drupal’s JSON:API directly into reactive Vue components. It won the Splash Award at DrupalCon Singapore 2024.',
      'I also built File (Field) Paths back when Drupal 6 was new, and still maintain it today.',
      'When I’m not shipping code I fly drones along the Victorian coast and pretend I’ll write more blog posts.',
    ],
  },
  openSource: {
    description: 'Two decades of Drupal contrib and the Druxt ecosystem. Most of what I build, I build in the open.',
    druxt: 'A fully decoupled Drupal + Nuxt framework. Maps Drupal\'s JSON:API straight into Vue components. Content modelling on the back, modern DX on the front.',
  },
  community: {
    description: 'Conference talks, DrupalCons attended, community recognition and the events I\'ve helped organise and teach. Fifteen years of Drupal and counting.',
    splashAward: 'For DruxtJS, the framework that makes decoupled Drupal feel native to Nuxt developers.',
  },
} as const

/** Where Stuart publishes code, as linked from the Open source page. */
const PROFILES: readonly { name: string, url: string }[] = [
  { name: 'GitHub', url: 'https://github.com/Decipher' },
  { name: 'Drupal.org', url: 'https://www.drupal.org/u/deciphered' },
  { name: 'npm', url: 'https://www.npmjs.com/~deciphered' },
  { name: 'Drupal GitLab', url: 'https://git.drupalcode.org/deciphered' },
]

/** A Markdown list, one line per item. */
const list = (items: string[]): string => items.map(item => `- ${item}`).join('\n')

/** A drupal.org project link. */
const project = (name: string, machine: string): string => `[${name}](https://www.drupal.org/project/${machine})`

/**
 * Build the page documents.
 *
 * Fields are picked explicitly, never spread: ``talks`` and ``organizerRoles``
 * carry ``evidence`` notes that cite a private email archive and must not be
 * published.
 *
 * @returns The About, Open source and Community pages, in that order.
 */
export function buildPageDocuments(): PageDocument[] {
  const { about, openSource, community } = PAGE_PROSE

  return [
    {
      path: '/about',
      title: 'About Stuart Clark',
      description: about.description,
      body: [
        ...about.bio,
        '### At a glance',
        list(stats.map(stat => `${stat.value} ${stat.label}`)),
        '### Expertise',
        list(expertise.map(item => `**${item.name}** (${item.tag}): ${item.description}`)),
        '### Elsewhere',
        list(site.socials.map(social => `[${social.label}](${social.href})`)),
      ],
    },
    {
      path: '/open-source',
      title: 'Open source',
      description: openSource.description,
      body: [
        list(PROFILES.map(profile => `[${profile.name}](${profile.url})`)),
        '### DruxtJS',
        `${openSource.druxt} Started in 2019, 25+ packages, MIT licensed, and winner of the Splash Award at DrupalCon Singapore 2024. Documentation at https://druxtjs.org.`,
        '### Drupal modules',
        // Install counts are the build-time snapshot in app/data/modules.ts;
        // the page refreshes them live from drupal.org.
        list(modules.map(module => `${project(module.name, module.machine)}: ${module.installs} sites`)),
        '### Co-maintained',
        list(coMaintainedMachineNames.map(machine => project(machine, machine))),
      ],
    },
    {
      path: '/community',
      title: 'Speaking and community',
      description: community.description,
      body: [
        `**Open Source Splash Award**, DrupalCon Singapore 2024. ${community.splashAward}`,
        '### Talks',
        list([...talks]
          .sort((a, b) => Number(b.year) - Number(a.year))
          .map(talk => `**${talk.title.replace(/\.$/, '')}**, ${talk.event}, ${talk.year}. ${talk.description}`)),
        '### DrupalCons attended',
        list(drupalcons.map(con => `${con.year}: ${con.city}${con.note ? ` (${con.note})` : ''}`)),
        '### Organising and training',
        list(organizerRoles.map(role => `**${role.event}**, ${role.period}: ${role.role}`)),
      ],
    },
  ]
}
