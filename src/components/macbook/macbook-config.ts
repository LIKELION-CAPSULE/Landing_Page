import type { Box3, Mesh, MeshBasicMaterial, Object3D, Texture } from 'three'

export const MACBOOK_MODEL_URL = '/models/macbook_web_ready.glb'
export const MACBOOK_PREVIEW_URL = '/images/website-preview.webp'
export const MACBOOK_OPEN_ROTATION = -Math.PI / 2
export const MACBOOK_FRONT_VIEW = {
  fov: 22,
  widthRatio: 0.96,
  targetOffsetY: -0.012,
} as const

// Timeline positions are normalized: the complete sequence lasts one unit.
export const MACBOOK_TIMING = {
  openStart: 0.06,
  openDuration: 0.72,
  screenStart: 0.64,
  screenDuration: 0.22,
  copyStart: 0.90,
  copyStagger: 0.025,
  copyDuration: 0.075,
  scrub: 0.45,
} as const

export type MacbookLoadStatus = 'loading' | 'ready' | 'error'

export type MacbookRig = {
  root: Object3D
  presentation: Object3D
  baseBounds: Box3
  hinge: Object3D
  screen: Mesh
  screenMaterial: MeshBasicMaterial
  previewTexture: Texture
}

export type MacbookSnapshot = {
  scrollProgress: number
  animationProgress: number
  hingeDegrees: number
  height: number
  rotationDegrees: number
  modelVisible: boolean
  screenBrightness: number
  frontView: boolean
  stage: string
}

export const INITIAL_MACBOOK_SNAPSHOT: MacbookSnapshot = {
  scrollProgress: 0,
  animationProgress: 0,
  hingeDegrees: 0,
  height: 0,
  rotationDegrees: 0,
  modelVisible: false,
  screenBrightness: 0,
  frontView: true,
  stage: '문구 타이핑',
}

export function macbookStage(progress: number) {
  if (progress >= MACBOOK_TIMING.screenStart + MACBOOK_TIMING.screenDuration) return '서비스 화면'
  if (progress >= MACBOOK_TIMING.screenStart) return '디스플레이 켜짐'
  if (progress >= MACBOOK_TIMING.openStart) return '맥북 펼치기'
  return '닫힌 맥북'
}
