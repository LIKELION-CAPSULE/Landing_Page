// Pixel pictures of the app's pixel family (Front_Web src/shared/ui/pixel/pixel-art.ts and
// src/features/mobile-gate/feature-icons.ts, 2026-11-28). Rows of characters, `.` = empty, every other
// character a palette colour. scripts/build-pixel-art.mjs writes each to src/assets/pixel/*.svg (drawn at 2 CSS px
// per art pixel). No imports here, so Node runs that script on this file directly.

export type PixelArt = { rows: readonly string[]; palette: Readonly<Record<string, string>> }

const INK = '#FAFAFD'
const SKY = '#8AD0F4'
const DARK = '#0F0E17'
const DIM = '#5E5C69'

/** The CAPSULE logo capsule (logo v2 colours), 20×10. */
const CAPSULE: PixelArt = {
  rows: [
    '.............ccccc..',
    '..........ccccccccc.',
    '.......ahhccccccddd.',
    '....aaaaahhccdddddd.',
    '..aaaaaaahhdddddddd.',
    '.aaaaaabbssdddddd...',
    '.aaabbbbbbssdddd....',
    '.abbbbbbbbssd.......',
    '.bbbbbbbbb..........',
    '..bbbbb.............',
  ],
  palette: { a: '#FFFFFF', b: '#D4C3FA', c: '#FFFFFF', d: '#CAB2F9', h: '#B397FC', s: '#8053F2' },
}

/** A screen with someone in it on a stand: the video-call feeling. */
const CALL: PixelArt = {
  rows: [
    'aaaaaaaaaaaa', 'abbbbbbbbbba', 'abbbbccbbbba', 'abbbccccbbba', 'abbbccccbbba', 'abbbbccbbbba',
    'abbccccccbba', 'abccccccccba', 'aaaaaaaaaaaa', '.....aa.....', '...aaaaaa...', '............',
  ],
  palette: { a: INK, b: DARK, c: SKY },
}

/** A calendar whose days fill up: time spent together, kept. */
const RECORD: PixelArt = {
  rows: [
    '..a......a..', 'aaaaaaaaaaaa', 'aaaaaaaaaaaa', 'abbbbbbbbbba', 'abccbccbddba', 'abccbccbddba',
    'abbbbbbbbbba', 'abddbccbccba', 'abddbccbccba', 'abbbbbbbbbba', 'aaaaaaaaaaaa', '............',
  ],
  palette: { a: INK, b: DARK, c: SKY, d: DIM },
}

/** Credit coin (credit display exception: gold only here). */
const COIN: PixelArt = {
  rows: [
    '....aaaa....', '..aaabbaaa..', '.aawbbbbbaa.', '.awbbaabbba.', 'aabbbaabbbaa', 'abbbbaabbbba',
    'abbbbaabbbba', 'aabbbaabbbaa', '.abbbaabbba.', '.aabbbbbbaa.', '..aaabbaaa..', '....aaaa....',
  ],
  palette: { a: '#F4B95F', b: '#8A6430', w: '#FFE3B0' },
}

/** A pixel heart in the affection pink (intimacy). */
const HEART: PixelArt = {
  rows: ['.aa.aa.', 'awaaaaa', 'aaaaaaa', '.aaaaa.', '..aaa..', '...a...'],
  palette: { a: '#F971B3', w: '#F4A9C9' },
}

const DIGIT = (rows: readonly string[]): PixelArt => ({ rows, palette: { a: INK } })
export const PIXEL_DIGITS: readonly PixelArt[] = [
  DIGIT(['.a.', 'aa.', '.a.', '.a.', 'aaa']),
  DIGIT(['aa.', '..a', '.a.', 'a..', 'aaa']),
  DIGIT(['aa.', '..a', '.a.', '..a', 'aa.']),
  DIGIT(['a.a', 'a.a', 'aaa', '..a', '..a']),
  DIGIT(['aaa', 'a..', 'aa.', '..a', 'aa.']),
]

export const PIXEL_ART = { capsule: CAPSULE, call: CALL, record: RECORD, coin: COIN, heart: HEART } satisfies Record<string, PixelArt>
export type PixelArtName = keyof typeof PIXEL_ART

export function pixelArtSize(art: PixelArt, scale = 2) {
  return { width: art.rows[0]!.length * scale, height: art.rows.length * scale }
}
