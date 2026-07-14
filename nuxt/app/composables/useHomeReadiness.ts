/**
 * Shared signal for whether the homepage's primary above-the-fold data
 * (the activity feed) has settled. Used by the splash screen to decide
 * when it's safe to hide without a fixed, content-unaware timer.
 */
export function useHomeReadiness() {
  return useState('home-readiness', () => false)
}
