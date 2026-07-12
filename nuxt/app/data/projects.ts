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
    meta: '29,589 sites',
    href: 'https://www.drupal.org/project/filefield_paths',
  },
  {
    tag: 'Open source',
    name: '175+ projects',
    description: 'Modules, packages, and tools across Drupal.org, npm, and GitHub. Most of what I build, I build in the open.',
    meta: 'github.com/Decipher',
    href: 'https://github.com/Decipher',
  },
]
