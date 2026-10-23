interface SocialLink {
  label: string
  href: string
  /** Link relation, e.g. "me" where the profile links back for identity verification. */
  rel?: string
}

export interface SiteConfig {
  name: string
  tagline: string
  intro: string
  location: string
  status: string
  socials: SocialLink[]
}

export const site: SiteConfig = {
  name: 'stuar.tc',
  tagline: 'Doing Druxt.',
  intro: 'Senior Drupal & JavaScript engineer in Ballarat, Australia. Creator of DruxtJS.',
  location: 'Ballarat, Australia',
  status: 'Open to contract · available now',
  socials: [
    { label: 'drupal.org', href: 'https://www.drupal.org/u/deciphered' },
    { label: 'github', href: 'https://github.com/Decipher' },
    { label: 'linkedin', href: 'https://au.linkedin.com/in/stuartclark4' },
    { label: '/dev/null', href: 'https://dev-null.sh/@Decipher', rel: 'me' },
  ],
}
