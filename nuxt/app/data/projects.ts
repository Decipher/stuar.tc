export interface Project {
  tag: string
  name: string
  description: string
  meta: string
}

export const projects: Project[] = [
  {
    tag: 'Framework',
    name: 'DruxtJS',
    description: 'Fully decoupled Drupal + Nuxt. Splash Award winner at DrupalCon Singapore 2024.',
    meta: 'Creator · open source',
  },
  {
    tag: 'Module',
    name: 'File (Field) Paths',
    description: 'The most-installed single contrib module by one author in Drupal history.',
    meta: '31,546 sites',
  },
  {
    tag: 'Ecosystem',
    name: 'The Druxt ecosystem',
    description: '170+ contrib projects spanning the decoupled Drupal + Nuxt stack.',
    meta: '2019 to now',
  },
]
