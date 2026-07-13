import { computed, toValue } from 'vue'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import { encode } from 'uqr'

/** QR error-correction level. */
export type QrEccLevel = 'L' | 'M' | 'Q' | 'H'

/** Options for {@link useQrCode}. */
export interface UseQrCodeOptions {
  /**
   * Error-correction level. Defaults to `H` (≈30% recovery) so codes survive
   * social-platform recompression and downscaling.
   */
  level?: QrEccLevel
}

/** A resolved QR module matrix plus its dimensions. */
export interface QrMatrix {
  /** Two-dimensional module grid; `true` is a dark module. */
  modules: boolean[][]
  /** Width and height of the matrix, in modules. */
  size: number
  /** QR version (1–40). */
  version: number
}

/** Cache key → matrix. encode() is deterministic, so identical inputs reuse a result. */
const cache = new Map<string, QrMatrix>()

/**
 * Build a QR module matrix for a value at a given error-correction level.
 *
 * Pure wrapper around `uqr`'s `encode()`; extracted so the build-side (Satori
 * OG image template) and runtime (browser SVG component) share one code path.
 *
 * @param value - The data to encode.
 * @param level - Error-correction level.
 * @returns The resolved {@link QrMatrix}.
 */
function toMatrix(value: string, level: QrEccLevel): QrMatrix {
  const result = encode(value, { ecc: level, border: 0 })
  return { modules: result.data, size: result.size, version: result.version }
}

/**
 * Reactive QR module matrix. Memoised via a module-level cache keyed by
 * `${level}:${value}`, and re-evaluated reactively only when the encoded
 * value or level changes.
 *
 * Used by {@link app/components/AppQrCode.vue} (runtime) and the Satori OG
 * image template (build time), so both contexts never diverge in encoding.
 *
 * @param value - The data to encode (ref or getter for reactivity).
 * @param options - See {@link UseQrCodeOptions}; `level` defaults to `H`.
 * @returns A computed {@link QrMatrix}.
 */
export function useQrCode(
  value: MaybeRefOrGetter<string>,
  options: UseQrCodeOptions = {},
): ComputedRef<QrMatrix> {
  const level = options.level ?? 'H'
  return computed<QrMatrix>(() => {
    const raw = toValue(value)
    const key = `${level}:${raw}`
    const cached = cache.get(key)
    if (cached)
      return cached
    const matrix = toMatrix(raw, level)
    cache.set(key, matrix)
    return matrix
  })
}
