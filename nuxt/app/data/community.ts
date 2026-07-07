export interface OrganizerRole {
  event: string
  role: string
  period: string
  evidence: string[]
}

export const organizerRoles: OrganizerRole[] = [
  {
    event: 'DrupalCamp Melbourne',
    role: 'Camp organisation (with Vladimir Roudakovov)',
    period: '2017',
    evidence: [
      'bichon email archive — account 1773099917253982',
    ],
  },
  {
    event: 'Drupal Global Training Days Melbourne',
    role: 'Community training day (DrupalGTD)',
    period: 'Jan 2017',
    evidence: [
      'bichon email archive — account 1773099917253982',
    ],
  },
  {
    event: 'Acquia Training — Canberra',
    role: 'govCMS training · delivery partner',
    period: 'Aug 2015',
    evidence: [
      'Existing author-profile entry (wiki/author-profile.md)',
    ],
  },
  {
    event: 'Acquia Training — Adelaide',
    role: 'DECD 3-day Drupal training · delivery partner',
    period: 'Jul 2015',
    evidence: [
      'Existing author-profile entry (wiki/author-profile.md)',
    ],
  },
  {
    event: 'Acquia Training — Melbourne',
    role: 'Drupal 7 in a Day · delivery partner',
    period: 'Jun 2015',
    evidence: [
      'Existing author-profile entry (wiki/author-profile.md)',
    ],
  },
  {
    event: 'DrupalCamp Melbourne',
    role: 'Camp organisation',
    period: '2014',
    evidence: [
      'bichon email archive — account 1773099917253982',
    ],
  },
  {
    event: 'Drupal Downunder 2013',
    role: 'Website build for the follow-on Melbourne event',
    period: '2013',
    evidence: [
      'bichon email archive — DDU2013 website build threads, account 1773099917253982',
    ],
  },
  {
    event: 'DrupalCon Sydney 2013',
    role: 'Local organising team',
    period: 'Sep 2012 – Feb 2013',
    evidence: [
      'bichon email archive — DCSYD organising threads, account 1773099917253982',
    ],
  },
  {
    event: 'Drupal Global Training Days Melbourne',
    role: 'DrupalMel community learning day',
    period: '2012',
    evidence: [
      'bichon email archive — account 1773099917253982',
    ],
  },
  {
    event: 'Drupal Melbourne meetup',
    role: 'Ongoing mentoring & community involvement',
    period: '2011 – present',
    evidence: [
      'bichon email archive — account 1773099917253982',
      'User recollection',
      'Existing resume entry (resume/resume.md)',
    ],
  },
  {
    event: 'Drupal Downunder',
    role: 'Conference planning, website, presenter selection',
    period: 'Jan 2011 – Apr 2012',
    evidence: [
      'Existing resume entry (resume/resume.md)',
      'bichon email archive — DDU2012 planning threads, account 1773099917253982',
    ],
  },
]
