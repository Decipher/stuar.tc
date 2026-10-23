/**
 * An abort signal that fires after `ms`, backed by a ref'd timer.
 *
 * `AbortSignal.timeout()` runs on an unref'd timer, so it never keeps Node
 * alive. During `nuxi generate`, an outbound fetch that stalls without
 * holding a handle of its own left the prerenderer with an empty event loop:
 * the process exited 0 mid-render and dropped the pages waiting on it (seen
 * on GitHub's runners, not locally). A ref'd timer keeps the process up
 * until the fetch settles or the timeout aborts it. Call `clear` once the
 * response body has been read.
 *
 * @param ms - Milliseconds until the signal aborts with a `TimeoutError`.
 * @returns The signal, and `clear` to cancel the timer.
 */
export function timeoutSignal(ms: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new DOMException('The operation timed out.', 'TimeoutError')), ms)
  return { signal: controller.signal, clear: () => clearTimeout(timer) }
}
