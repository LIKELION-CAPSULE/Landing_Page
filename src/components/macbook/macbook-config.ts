import type { Box3, Mesh, MeshBasicMaterial, Object3D, Texture } from 'three'

export const MACBOOK_MODEL_URL = '/models/macbook_web_ready.glb'
export const MACBOOK_PREVIEW_URL = '/images/website-preview.webp'
export const MACBOOK_OPEN_ROTATION = -1.919862177
export const MACBOOK_INITIAL_POSE = {
  height: 0.09, x: 0, z: 0,
  rotationX: 0, rotationY: 0, rotationZ: 0,
} as const
export const MACBOOK_SPIN_POSE = {
  rotationX: 0.12,
  rotationY: Math.PI * 2,
  rotationZ: -0.06,
} as const
export const MACBOOK_LANDED_POSE = {
  rotationX: 0,
  rotationY: Math.PI * 2,
  rotationZ: 0,
} as const
export const MACBOOK_FINAL_FRAMING = {
  fov: 22,
  widthRatio: 0.96,
  targetOffsetY: -0.012,
} as const

// Timeline positions are normalized: the complete sequence lasts one unit.
export const MACBOOK_TIMING = {
  liftStart: 0.04,
  liftDuration: 0.14,
  spinStart: 0.18,
  spinDuration: 0.36,
  landStart: 0.54,
  landDuration: 0.24,
  openStart: 0.55,
  openDuration: 0.26,
  screenStart: 0.73,
  screenDuration: 0.16,
  framingStart: 0.78,
  framingDuration: 0.12,
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

export type MacbookController = {
  reset: () => void
  setPaused: (paused: boolean) => void
}

export const INITIAL_MACBOOK_SNAPSHOT: MacbookSnapshot = {
  scrollProgress: 0,
  animationProgress: 0,
  hingeDegrees: 0,
  height: MACBOOK_INITIAL_POSE.height,
  rotationDegrees: 0,
  modelVisible: false,
  screenBrightness: 0,
  frontView: true,
  stage: '문구 타이핑',
}

export function macbookStage(progress: number) {
  if (progress >= 0.89) return '서비스 화면'
  if (progress >= MACBOOK_TIMING.screenStart) return '디스플레이 켜짐'
  if (progress >= MACBOOK_TIMING.openStart) return '맥북 펼치기'
  if (progress >= MACBOOK_TIMING.spinStart) return '좌우 한 바퀴 회전'
  if (progress >= MACBOOK_TIMING.liftStart) return '회전 준비'
  return '닫힌 맥북'
}
