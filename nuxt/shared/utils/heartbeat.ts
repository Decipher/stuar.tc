/**
 * Which GitHub events the Heartbeat shows. Shared by the `/api/activity-gh`
 * route (which looks up PR titles only for events that will be shown) and
 * `useActivity` (which renders them), so the two can't drift apart.
 */

/** Low-signal GitHub event types that would clutter the feed. */
const EXCLUDED_GH_TYPES = new Set(['DeleteEvent', 'PushEvent', 'CreateEvent'])

/** GitHub event types whose payload refers to a pull request by number. */
export const GH_PR_EVENT_TYPES = new Set([
  'PullRequestEvent',
  'PullRequestReviewEvent',
  'PullRequestReviewCommentEvent',
])

/**
 * Whether a GitHub event belongs in the Heartbeat.
 *
 * @param event - The event's `type` and `payload.action`.
 * @param event.type - GitHub event type, e.g. "IssuesEvent".
 * @param event.payload - The event payload; only `action` is read.
 * @returns `false` for pushes, branch/tag creation and deletion, and issue
 *   label changes; `true` otherwise.
 */
export function isHeartbeatGHEvent(event: { type?: string; payload?: { action?: string } }): boolean {
  if (!event.type || EXCLUDED_GH_TYPES.has(event.type)) return false
  if (event.type === 'IssuesEvent' && event.payload?.action === 'labeled') return false
  return true
}
