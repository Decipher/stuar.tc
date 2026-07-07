export interface OrganizerRole {
  event: string
  role: string
  period: string
  evidence: string[]
}

export const organizerRoles: OrganizerRole[] = [
  {
    event: 'Drupal Downunder',
    role: 'Conference planning, website development, presenter selection',
    period: 'Jan 2011 – Apr 2012',
    evidence: [
      'Existing resume entry (resume/resume.md)',
      'bichon email archive — DDU2012 planning threads, account 1773099917253982',
    ],
  },
  {
    event: 'Drupal Downunder 2013',
    role: 'Website build for the follow-on Melbourne Drupal event',
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
    event: 'DrupalCamp Melbourne',
    role: 'Camp organisation (catering)',
    period: '2014',
    evidence: [
      'bichon email archive — account 1773099917253982',
    ],
  },
  {
    event: 'DrupalCamp Melbourne',
    role: 'Camp organisation (in collaboration with Vladimir Roudakovov)',
    period: '2017',
    evidence: [
      'bichon email archive — account 1773099917253982',
    ],
  },
  {
    event: 'Drupal Global Training Days Melbourne',
    role: '"DrupalMel learning day" community training',
    period: '2012',
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
    event: 'Drupal Melbourne meetup',
    role: 'Ongoing mentoring and community involvement',
    period: '2011 – present',
    evidence: [
      'bichon email archive — account 1773099917253982',
      'User recollection',
      'Existing resume entry (resume/resume.md)',
    ],
  },
  {
    event: 'Acquia Training — Drupal 7 in a Day (Melbourne)',
    role: 'Training delivery partner',
    period: 'Jun 2015',
    evidence: [
      'Existing author-profile entry (wiki/author-profile.md)',
    ],
  },
  {
    event: 'Acquia Training — DECD 3-day Drupal Training (Adelaide)',
    role: 'Training delivery partner',
    period: 'Jul 2015',
    evidence: [
      'Existing author-profile entry (wiki/author-profile.md)',
    ],
  },
  {
    event: 'Acquia Training — govCMS Training (Canberra)',
    role: 'Training delivery partner',
    period: 'Aug 2015',
    evidence: [
      'Existing author-profile entry (wiki/author-profile.md)',
    ],
  },
]
