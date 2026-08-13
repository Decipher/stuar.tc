# Sponsor CTA Analytics Setup

This guide covers the GA4 tracking for sponsor call-to-action (CTA) clicks on
stuar.tc, and the steps to configure conversion tracking in the GA4 dashboard.

## What is tracked

Every code-controlled sponsor CTA click fires a GA4 `sponsor_click` custom
event with two parameters:

| Parameter  | Example values                       | Description                                      |
|------------|--------------------------------------|--------------------------------------------------|
| `location` | `open-source`, `article-repo-card`   | Where on the site the click happened             |
| `target`   | `github-sponsors`                    | The destination (extensible for future targets)  |

Outbound sponsor URLs also carry UTM parameters so clicks are attributable
in GitHub's own referral data:

| UTM param      | Value                                | Notes                             |
|----------------|--------------------------------------|-----------------------------------|
| `utm_source`   | `stuar.tc`                           | Fixed                             |
| `utm_medium`   | `web`                                | Fixed                             |
| `utm_campaign` | `sponsor`                            | Fixed                             |
| `utm_content`  | `open-source` or `article-repo-card` | Matches the GA4 `location` param  |

## Where CTAs are tracked

| Location           | Component                                | GA4 event fires?                  | UTM params? |
|--------------------|------------------------------------------|-----------------------------------|-------------|
| Open-source page   | `AppOSSProfiles.vue` via `SCSponsorCard` | Yes                               | Yes         |
| Article repo cards | `AppDruxtParagraphRepository.vue`        | Yes (sponsor-eligible repos only) | Yes         |
| Article body text  | Drupal-authored content                  | No (content, not code)            | No          |

Article body-text sponsor mentions are authored in Drupal and are out of
scope for event tracking. Only code-controlled CTAs are tracked.

## Marking `sponsor_click` as a GA4 conversion

GA4 custom events appear in Realtime within seconds but can take 24-48h to
show in standard reports. To make `sponsor_click` usable in funnels and
conversions:

1. Open GA4 Admin (gear icon, bottom left).
2. Go to **Events** under the **Property** column.
3. Find `sponsor_click` in the event list (it appears after the first click
   is recorded; trigger one in production if it's not there yet).
4. Toggle **Mark as conversion**.

Once marked, the event appears under **Conversions** and can be used in:

- Conversion funnels (e.g., landing page -> sponsor click)
- Audience segmentation (users who clicked a sponsor CTA)
- Google Ads import (if running paid campaigns)

## Reading the sponsor CTA effectiveness report

After marking as a conversion, build a custom report:

1. Go to **Reports > Engagement > Events**.
2. Filter for `sponsor_click`.
3. Use the `location` parameter as a secondary dimension to compare:
   - Open-source page CTA vs. article repo card CTA effectiveness
   - Which articles drive the most sponsor clicks

To cross-reference with traffic source:

1. Go to **Reports > Acquisition > Traffic acquisition**.
2. Filter for the `sponsor` campaign (from the UTM params).
3. Compare conversion rates by source/medium (organic search, Planet Drupal,
   dev.to, direct, etc.).

## Development notes

- The tracking is implemented in `app/composables/useSponsorTracking.ts`.
- `window.dataLayer.push()` (the GA4 command queue from `nuxt-gtag`) is used
  directly instead of `useGtag()` because `useGtag()` returns a server-side
  no-op in the test environment. The optional chaining (`?.`) on
  `window.dataLayer` makes the push a no-op in dev/SSR automatically.
- The UTM-tagged URL is a `ComputedRef` so it's reactive and consistent
  between the `href` attribute and the GA4 event `location` parameter.
- Visual regression baselines are unaffected: tracking is additive and UTM
  params are query strings that don't change the destination page.
