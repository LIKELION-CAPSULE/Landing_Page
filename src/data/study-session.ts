import kangStudy from '../assets/optimized/story/study-session/kang-study.webp'
import hanStudy from '../assets/optimized/story/study-session/han-study.webp'
import ryuStudy from '../assets/optimized/story/study-session/ryu-study.webp'
import selfStudy from '../assets/optimized/story/study-session/self-study.webp'
import ryuReaction from '../assets/optimized/story/study-session/ryu-reaction.webp'
import selfPhone from '../assets/optimized/story/study-session/self-phone.webp'
import kangReaction from '../assets/optimized/story/study-session/kang-reaction.webp'
import hanReaction from '../assets/optimized/story/study-session/han-reaction.webp'
import kangAffection from '../assets/optimized/story/study-session/kang-affection.webp'
import hanAffection from '../assets/optimized/story/study-session/han-affection.webp'
import ryuAffection from '../assets/optimized/story/study-session/ryu-affection.webp'
import heart from '../assets/story/study-session/heart.svg'
import poster from '../assets/optimized/hero/poster-1.webp'

export type SessionMode = 'study' | 'reaction' | 'affection'

// Figma's 스텝별화면 section: 23:2376 / 23:2476 / 23:2583.
// Keep each portrait independent of its UI and use example values for the demo.
export const STUDY_CAMERAS = [
  { id: 'kang', name: '강채린', study: kangStudy, reaction: kangReaction, affection: kangAffection, affinity: 82, dialoguePhase: 2, dialogue: '“아 슬슬 집중 안되네,\n너 때문이잖아.\n어떻게 책임질래?”' },
  { id: 'han', name: '한수아', study: hanStudy, reaction: hanReaction, affection: hanAffection, affinity: 76, dialoguePhase: 3, dialogue: '“왜 자꾸 공부 안하고\n나만 쳐다봐?”' },
  { id: 'ryu', name: '류다희', study: ryuStudy, reaction: ryuReaction, affection: ryuAffection, affinity: 69, dialoguePhase: 4, dialogue: '“공부 많이 했네!!\n한쪽 줄게. 노동요 같이 듣자!”' },
  { id: 'self', name: '나', study: selfStudy, reaction: selfPhone },
] as const

export function sessionPose(mode: SessionMode, phase: number, id: string) {
  const camera = STUDY_CAMERAS.find(camera => camera.id === id)
  if (mode === 'affection' && camera && 'dialoguePhase' in camera && phase >= camera.dialoguePhase) return 'affection'
  if (mode === 'reaction' && phase < 4 && phase >= (id === 'self' ? 1 : 2)) return 'reaction'
  return 'study'
}

export function sessionMetrics(mode: SessionMode, phase: number, progress: number) {
  if (mode === 'study') {
    const growth = phase < 5 ? 0 : phase === 5 ? progress * 0.5 : phase === 6 ? 0.5 + progress * 0.5 : 1
    return { seconds: Math.floor(9497 * growth), affinity: (base: number) => Math.floor(base * growth) }
  }
  if (mode === 'affection') {
    const stops = [0, 0.15, 0.42, 0.7, 1, 1, 1]
    const growth = phase === 0 ? 0 : stops[phase - 1] + (stops[phase] - stops[phase - 1]) * progress
    return { seconds: Math.floor(9497 + 1303 * growth), affinity: (base: number) => Math.floor(base + (100 - base) * growth) }
  }
  return { seconds: 9497, affinity: (base: number) => base }
}

export function formatStudyTime(seconds: number) {
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(value => String(value).padStart(2, '0')).join(':')
}

const BASE_IMAGES = [...STUDY_CAMERAS.map(camera => camera.study), heart]
const REACTION_IMAGES = [...BASE_IMAGES, selfPhone, kangReaction, hanReaction, ryuReaction]
const AFFECTION_IMAGES = [...BASE_IMAGES, kangAffection, hanAffection, ryuAffection]

// Prepare the current and next phase, rather than fetching every pose on load.
export const DEMO_PHASE_IMAGES = {
  1: [[], [], [], [], BASE_IMAGES, BASE_IMAGES, BASE_IMAGES, BASE_IMAGES],
  2: [BASE_IMAGES, [...BASE_IMAGES, selfPhone], REACTION_IMAGES, REACTION_IMAGES, BASE_IMAGES],
  3: [BASE_IMAGES, BASE_IMAGES, [...BASE_IMAGES, kangAffection], [...BASE_IMAGES, kangAffection, hanAffection], AFFECTION_IMAGES, AFFECTION_IMAGES, [...AFFECTION_IMAGES, poster]],
} as const

export { heart, poster }
