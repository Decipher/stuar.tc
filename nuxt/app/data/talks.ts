export interface Talk {
  title: string
  event: string
  year: string
  description: string
  tags: string[]
  confidence: 'high' | 'medium'
  evidence: string[]
}

export const talks: Talk[] = [
  {
    title: 'Features 101',
    event: 'DrupalSouth Wellington',
    year: '2014',
    description: 'Site building with the Features module — capturing Drupal configuration into version-controlled code for repeatable deploys and team workflows.',
    tags: ['Drupal', 'Features', 'Site Building'],
    confidence: 'high',
    evidence: [
      'bichon envelope 1773099917253982/33ff4a66-6c57-443a-a46b-4cf9970d0dec — drupalsouth@drupal.org.nz Speaker Confirmation, 2013-11-28',
      'bichon envelope 1773099917253982/637f1fe7-54dd-4833-b348-b32cd105fff2 — chriswhward@gmail.com, 2013-11-13: "your session proposal(s) in Site Building, I think my preference is to Features 101"',
    ],
  },
  {
    title: 'Wysiwyg Fields',
    event: 'DrupalGov Canberra',
    year: '2016',
    description: 'Wysiwyg Field Callback Formatter (WFCF) — embedding field-rendered content directly into the Wysiwyg editor, presented at DrupalGov Canberra on 8 February 2016.',
    tags: ['Drupal', 'Wysiwyg Fields', 'WFCF'],
    confidence: 'high',
    evidence: [
      'bichon envelope 1773099917253982/f1c0074a-372d-4acb-bdde-93dada4f8f90 — info@drupalgov.org acceptance, 2016-01-12',
      'bichon envelope 1773099917253982/141c8857-8816-4dfc-a618-e4fe6332cd31 — Stuart\'s reply with slides URL "Wysiwyg Fields (Drupalgov).key" (talk title derived from filename)',
    ],
  },
  {
    title: 'Druxt.js',
    event: 'Sydney Drupal Meetup',
    year: '2020',
    description: 'Introduction to DruxtJS — the Fully Decoupled Drupal Framework that maps Drupal\'s JSON:API into reactive Vue/Nuxt components. Presented at the Sydney Drupal Meetup in September 2020.',
    tags: ['Druxt', 'Drupal', 'Vue.js', 'Nuxt'],
    confidence: 'high',
    evidence: [
      'YouTube recording https://www.youtube.com/watch?v=cuzCZ0v_PGg — titled "Druxt.js - Stuart Clark", description "Sydney Drupal Meetup - September 2020"',
    ],
  },
  {
    title: 'Druxt.js: Nuxt.js in the front, Drupal in the back.',
    event: 'DrupalGov 2020 (virtual)',
    year: '2020',
    description: 'How DruxtJS bridges Drupal and Nuxt.js for fully decoupled site architectures, preserving Drupal display modes and JSON:API semantics while delivering a modern Vue.js frontend. Presented at the virtual DrupalGov on 4–5 November 2020 in the Front-end Development track.',
    tags: ['Druxt', 'Drupal', 'Vue.js', 'Nuxt', 'Decoupled'],
    confidence: 'high',
    evidence: [
      'bichon envelope 1773099917253982/028397dc-4e2b-4356-827d-9711619aba82 — drupalgov2020@drupalsouth.org "You have been selected to present", 2020-10-08',
      'bichon envelope 1773099917253982/acd557e4-60e1-406e-9b7b-4694b188db54 — submission thread',
    ],
  },
  {
    title: 'Custom Formatters',
    event: 'Drupal Downunder (Melbourne)',
    year: '2012',
    description: 'Creating custom field formatters without writing a custom module — the pluggable-editor architecture of the Custom Formatters module. Presented at Drupal Downunder in Melbourne, January 2012.',
    tags: ['Drupal', 'Custom Formatters'],
    confidence: 'medium',
    evidence: [
      'bichon envelope 1773099917253982/e35a14e3-a182-4cf3-848f-55c018d298c4 — rejected to backup list, 2011-11-30',
      'bichon envelope 1773099917253982/e4d6eb84-a8cb-4d1d-be8b-343ed611bc28 — "Important Presenter Information" received, 2012-01-10 (would not have been sent to a non-presenter; final confirmation not located)',
    ],
  },
  {
    title: 'Moving to a sustainable web',
    event: 'Online community meetup',
    year: '2024',
    description: 'Community meetup talk on web sustainability — building and operating websites with a lower carbon footprint. 22 February 2024.',
    tags: ['Sustainability', 'Web', 'Community'],
    confidence: 'medium',
    evidence: [
      'TheDropTimes profile https://www.thedroptimes.com/people/36095/deciphered — lists "Community Meetup: Moving to a sustainable web" on Thu, Feb 22 2024 (Online) under Stuart\'s profile; listing does not disambiguate attendee vs. organiser vs. speaker',
    ],
  },
]
