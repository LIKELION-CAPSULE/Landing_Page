import kangStudy from '../assets/story/study-session/kang-study.webp'
import hanStudy from '../assets/story/study-session/han-study.webp'
import ryuStudy from '../assets/story/study-session/ryu-study.webp'
import selfStudy from '../assets/story/study-session/self-study.webp'
import ryuReaction from '../assets/story/study-session/ryu-reaction.webp'
import selfPhone from '../assets/story/study-session/self-phone.webp'
import kangAffection from '../assets/story/study-session/kang-affection.webp'
import hanAffection from '../assets/story/study-session/han-affection.webp'
import ryuAffection from '../assets/story/study-session/ryu-affection.webp'
import heart from '../assets/story/study-session/heart.svg'
import poster from '../assets/hero/poster-1.webp'

export type SessionMode = 'study' | 'reaction' | 'affection'

// Figma 12:953 / 12:1030 / 12:1118. Keep each portrait independent of its UI.
export const STUDY_CAMERAS = [
  { id: 'kang', name: '강채린', study: kangStudy, affection: kangAffection, affinity: 82 },
  { id: 'han', name: '한수아', study: hanStudy, affection: hanAffection, affinity: 76 },
  { id: 'ryu', name: '류다희', study: ryuStudy, reaction: ryuReaction, affection: ryuAffection, affinity: 90 },
  { id: 'self', name: '나', study: selfStudy, reaction: selfPhone },
] as const

export function sessionPose(mode: SessionMode, phase: number, id: string) {
  if (mode === 'affection' && phase >= 2 && id !== 'self') return 'affection'
  if (mode === 'reaction' && (id === 'self' ? phase >= 1 && phase < 4 : id === 'ryu' && phase >= 2 && phase < 4)) return 'reaction'
  return 'study'
}

const BASE_IMAGES = [...STUDY_CAMERAS.map(camera => camera.study), heart]
const REACTION_IMAGES = [...BASE_IMAGES, selfPhone, ryuReaction]
const AFFECTION_IMAGES = [...BASE_IMAGES, kangAffection, hanAffection, ryuAffection]

// Prepare the current and next phase, rather than fetching every pose on load.
export const DEMO_PHASE_IMAGES = {
  1: [[], [], [], [], BASE_IMAGES],
  2: [BASE_IMAGES, [...BASE_IMAGES, selfPhone], REACTION_IMAGES, REACTION_IMAGES, BASE_IMAGES],
  3: [BASE_IMAGES, BASE_IMAGES, AFFECTION_IMAGES, AFFECTION_IMAGES, [...AFFECTION_IMAGES, poster]],
} as const

export { heart, poster }
