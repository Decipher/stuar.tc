export interface Project {
  tag: string
  name: string
  description: string
  meta: string
  href?: string
}

export const projects: Project[] = [
  {
    tag: 'Framework',
    name: 'DruxtJS',
    description: 'Fully decoupled Drupal + Nuxt. Splash Award winner at DrupalCon Singapore 2024.',
    meta: 'Creator · open source',
    href: 'https://druxtjs.org',
  },
  {
    tag: 'Module',
    name: 'File (Field) Paths',
    description: 'One of the most widely installed Drupal contrib modules.',
    meta: '30,463 sites',
    href: 'https://www.drupal.org/project/filefield_paths',
  },
  {
    tag: 'Ecosystem',
    name: 'The Druxt ecosystem',
    description: '170+ contrib projects spanning the decoupled Drupal + Nuxt stack.',
    meta: '2019 to now',
    href: 'https://www.drupal.org/u/deciphered',
  },
]
