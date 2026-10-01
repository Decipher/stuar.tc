export interface Expertise {
  tag: string
  name: string
  description: string
}

/** The About page's expertise cards, also listed in ``/llms-full.txt``. */
export const expertise: Expertise[] = [
  { tag: 'Core', name: 'Decoupled Drupal', description: 'JSON:API, RESTful, GraphQL - building API-first Drupal for JS front-ends.' },
  { tag: 'Framework', name: 'DruxtJS', description: 'Creator and maintainer of the 25+ package Druxt ecosystem for Nuxt.' },
  { tag: 'Frontend', name: 'Nuxt & Vue', description: 'SSR, SSG, and interactive client patterns with Nuxt UI and Tailwind.' },
  { tag: 'Backend', name: 'Drupal module dev', description: 'From File (Field) Paths to custom contrib - 20 years of Drupal internals.' },
  { tag: 'DevOps', name: 'CI/CD & hosting', description: 'GitHub Actions, Platform.sh, DDEV, and automated testing pipelines.' },
  { tag: 'Community', name: 'Mentoring & review', description: 'Patch reviews, issue triage, and Splash Award-winning contributions.' },
]
