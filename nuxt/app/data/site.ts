interface SocialLink {
  label: string
  href: string
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
  status: 'Open to senior roles · FY2026',
  socials: [
    { label: 'drupal.org', href: 'https://www.drupal.org/u/deciphered' },
    { label: 'github', href: 'https://github.com/Decipher' },
    { label: 'linkedin', href: 'https://au.linkedin.com/in/stuartclark4' },
  ],
}
