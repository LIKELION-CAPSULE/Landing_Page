// Geometry of the 404 scene. Pure data: no imports.
//
// The 0 of 「404」 is the CAPSULE logo v2 glyph (capsule-glyph-color.svg, Front_Web design/brand/
// capsule-logo-2026-11-22-v2/), cracked into pieces that drift a little apart: 「the link is broken」 told with the
// capsule. Coordinates are the glyph's own (its paths live in 75–410 × 104–370; centre ≈ 242.6 × 236.7).

export type Point = readonly [number, number]
export type CapsulePiece = {
  /** Crack polygon (glyph coordinates); the pieces together cover the whole glyph. */
  points: readonly Point[]
  /** Where the piece rests, pushed out from the centre (glyph px), and its tilt (deg). */
  dx: number; dy: number; rotate: number
  /** Drift loop length (s) and phase (s, negative = already moving on the first frame). */
  period: number; delay: number
  /** Pointer parallax weight. */
  depth: number
}

export const CAPSULE_CENTER: Point = [242.6, 236.7]

export const CAPSULE_PIECES: readonly CapsulePiece[] = [
  { points: [[60, 90], [196, 90], [226, 198], [150, 248], [60, 228]], dx: -16, dy: -12, rotate: -4, period: 9, delay: -2, depth: 10 },
  { points: [[196, 90], [430, 90], [430, 152], [300, 188], [226, 198]], dx: 10, dy: -18, rotate: 3, period: 11, delay: -6, depth: 14 },
  { points: [[430, 152], [430, 340], [334, 282], [300, 188]], dx: 20, dy: 2, rotate: 5, period: 10, delay: -4, depth: 12 },
  { points: [[226, 198], [300, 188], [334, 282], [262, 270]], dx: 3, dy: 1, rotate: -2, period: 8, delay: -1, depth: 6 },
  { points: [[60, 228], [150, 248], [226, 198], [262, 270], [228, 390], [60, 390]], dx: -18, dy: 12, rotate: 3, period: 12, delay: -8, depth: 16 },
  { points: [[262, 270], [334, 282], [430, 340], [430, 390], [228, 390]], dx: 8, dy: 18, rotate: -5, period: 10, delay: -3, depth: 11 },
]

export type GlassShard = {
  /** Polygon in % of the shard's own box. */
  points: readonly Point[]
  /** Box: left/top in % of the scene, width in % of the scene width (height follows `aspect`). */
  left: number; top: number; width: number; aspect: number
  rotate: number
  period: number; delay: number
  depth: number
}

/** Violet glass splinters around (and a few over) the number. */
export const GLASS_SHARDS: readonly GlassShard[] = [
  { points: [[0, 30], [100, 0], [70, 100]], left: 4, top: 8, width: 13, aspect: 0.9, rotate: -12, period: 13, delay: -3, depth: 26 },
  { points: [[10, 0], [100, 40], [40, 100], [0, 60]], left: 20, top: 58, width: 11, aspect: 1.1, rotate: 18, period: 15, delay: -9, depth: 20 },
  { points: [[0, 0], [100, 20], [60, 100]], left: 63, top: 4, width: 9, aspect: 1.3, rotate: 24, period: 12, delay: -5, depth: 30 },
  { points: [[20, 0], [100, 70], [0, 100]], left: 82, top: 46, width: 12, aspect: 1, rotate: -20, period: 14, delay: -7, depth: 24 },
  { points: [[0, 50], [80, 0], [100, 100]], left: 44, top: 70, width: 8, aspect: 0.8, rotate: 8, period: 11, delay: -2, depth: 34 },
  { points: [[0, 0], [100, 30], [30, 100]], left: 30, top: 2, width: 6, aspect: 1.2, rotate: -30, period: 10, delay: -4, depth: 40 },
  { points: [[30, 0], [100, 100], [0, 80]], left: 90, top: 10, width: 6, aspect: 1, rotate: 12, period: 13, delay: -1, depth: 38 },
  { points: [[0, 20], [100, 0], [80, 100], [10, 90]], left: 0, top: 66, width: 7, aspect: 1, rotate: 30, period: 12, delay: -6, depth: 36 },
]
