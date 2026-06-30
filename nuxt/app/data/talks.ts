export interface Talk {
  title: string
  event: string
  year: string
  description: string
  tags: string[]
}

export const talks: Talk[] = [
  {
    title: 'Decoupled Drupal with DruxtJS',
    event: 'DrupalCon Singapore',
    year: '2024',
    description: 'How DruxtJS maps Drupal\u2019s JSON:API into reactive Vue components \u2014 eliminating glue code while preserving entity semantics.',
    tags: ['Druxt', 'Nuxt', 'JSON:API'],
  },
  {
    title: 'Layout Paragraphs for decoupled front-ends',
    event: 'DrupalCon Lille',
    year: '2023',
    description: 'A practical pattern for surfacing nested paragraph structures to a JavaScript front-end without losing layout fidelity.',
    tags: ['Drupal', 'Paragraphs'],
  },
  {
    title: 'File (Field) Paths: 15 years of paths',
    event: 'DrupalCon Prague',
    year: '2022',
    description: 'Lessons from maintaining one of Drupal\u2019s most-installed contrib modules across five major core versions.',
    tags: ['Drupal', 'Maintenance'],
  },
  {
    title: 'Building the Druxt ecosystem',
    event: 'DrupalCon Amsterdam',
    year: '2019',
    description: 'The architecture behind 170+ contrib projects that make decoupled Drupal feel native to Nuxt developers.',
    tags: ['Druxt', 'Architecture'],
  },
]
