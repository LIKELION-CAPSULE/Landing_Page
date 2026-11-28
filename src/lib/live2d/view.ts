// Engine projection from Front_Web src/features/mate-render/aliving-view.ts (2026-11-28): `setView(zoom, cx, cy)`
// draws model point (mx, my) at (cw/2 + (mx − cx)·k, ch/2 + (my − cy)·k), k = min(cw, ch) / 1280 · zoom.
// The hero stills (760×900, head → waist) were rendered with CHAERIN_V2_RENDERS.hero; 서도현 stands in the same
// place on the model canvas, so one projection frames both, and the live model lands exactly on the still.

export const ALIVING_MODEL_SIZE = 1280

export interface AlivingView { zoom: number; cx: number; cy: number }
export interface ScreenBox { left: number; top: number; width: number; height: number }

export const HERO_RENDER = { size: { width: 760, height: 900 }, view: { zoom: 1.9718, cx: 640, cy: 384.6 } } as const
/** Eye line in model px (chaerin-v2 landmarks; 서도현's is ~17 px higher, close enough for gaze). */
export const EYES_MODEL_Y = 238

const clampUnit = (value: number) => Math.max(-1, Math.min(1, value)) || 0

/** Pointer → normalized gaze [-1, 1] (positive x looks right, positive y looks up). */
export function pointerGaze(pointerX: number, pointerY: number, faceX: number, faceY: number, width: number, height: number) {
  return {
    x: clampUnit((pointerX - faceX) / (Math.max(1, width) * 0.6)),
    y: clampUnit(-(pointerY - faceY) / (Math.max(1, height) * 0.6)),
  }
}

/**
 * Video-call close-up (the landing's first screen, 2026-11-28 user request: "face large, chest up"): the eye line
 * at `eyes` of the stage height and the face centre at `cx` of its width, `k` CSS px per model px.
 * k = min(kH × height, kW × width). The same numbers frame the prerendered hero still through CSS container
 * units (`closeUpStillCss`), so the still and the live model overlap exactly.
 */
export type CloseUp = { cx: number; eyes: number; kH: number; kW: number }
/** Landscape: face right of centre, head top ≈ 5% from the top, chest at the bottom edge. */
export const CLOSE_UP_WIDE: CloseUp = { cx: 0.62, eyes: 0.43, kH: 0.38 / 207, kW: 1 / 560 }
/** Portrait / phones: face centred in the top media box. */
export const CLOSE_UP_TALL: CloseUp = { cx: 0.5, eyes: 0.42, kH: 0.36 / 207, kW: 1 / 430 }

const MODEL_CX = 640

const n = (value: number) => Number(value.toFixed(4))
/** Rounded like the CSS below, so the still and the model use the very same scale. */
export function closeUpK(cw: number, ch: number, framing: CloseUp) {
  return Math.min(n(framing.kH * 100) * ch, n(framing.kW * 100) * cw) / 100
}

export function closeUpView(cw: number, ch: number, framing: CloseUp): AlivingView {
  const k = closeUpK(cw, ch, framing)
  const minStage = Math.max(1, Math.min(cw, ch))
  return {
    zoom: (k * ALIVING_MODEL_SIZE) / minStage,
    cx: MODEL_CX - (framing.cx * cw - cw / 2) / k,
    cy: EYES_MODEL_Y - (framing.eyes * ch - ch / 2) / k,
  }
}

/** The hero still's rectangle in model px (HERO_RENDER: centre 640 × 384.6, 760 × 900 at k 1.1707). */
const HERO_K = (Math.min(HERO_RENDER.size.width, HERO_RENDER.size.height) / ALIVING_MODEL_SIZE) * HERO_RENDER.view.zoom
const STILL = {
  left: HERO_RENDER.view.cx - HERO_RENDER.size.width / 2 / HERO_K,
  top: HERO_RENDER.view.cy - HERO_RENDER.size.height / 2 / HERO_K,
  width: HERO_RENDER.size.width / HERO_K,
  height: HERO_RENDER.size.height / HERO_K,
}

/** CSS (container units of the stage, which must be `container-type: size`) placing the hero still for `framing`. */
export function closeUpStillCss(framing: CloseUp) {
  const k = `min(${n(framing.kH * 100)}cqh, ${n(framing.kW * 100)}cqw)`
  return {
    left: `calc(${n(framing.cx * 100)}cqw - ${n(MODEL_CX - STILL.left)} * ${k})`,
    top: `calc(${n(framing.eyes * 100)}cqh - ${n(EYES_MODEL_Y - STILL.top)} * ${k})`,
    width: `calc(${n(STILL.width)} * ${k})`,
    height: `calc(${n(STILL.height)} * ${k})`,
  }
}
