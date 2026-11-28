// Phone or PC, for the CTA only (link vs 「PC로 링크 보내기」, the 「캡슐은 PC에서 만날 수 있어요」 note, analytics).
// The same rule as the app's mobile notice (Front_Web src/shared/lib/mobile-gate.ts isPhoneDevice): a touch-only
// pointer AND a short side under 600px. Never the viewport width alone: a narrowed PC window (fine pointer, hover)
// is a PC, and a phone held sideways (852 × 393) is still a phone, which the app would stop at its notice.
// Layout stays on the 767px breakpoint in CSS; this decides behaviour only. Free of imports and of the DOM so Node's
// test runner and vite.config.ts read it directly; lib/cta.ts isPhone() reads the browser.

export const PHONE_POINTER_QUERY = '(pointer: coarse) and (hover: none)'
export const PHONE_SHORT_SIDE = 600

export interface PhoneDetectionInput {
  coarseNoHover: boolean
  shortSidePx: number
}

/** The app's isPhoneDevice rule. The short side is the smallest of the viewport and the screen, as in the app. */
export const isPhoneDevice = ({ coarseNoHover, shortSidePx }: PhoneDetectionInput): boolean => coarseNoHover && shortSidePx < PHONE_SHORT_SIDE

export function shortSide(innerWidth: number, innerHeight: number, screenWidth?: number, screenHeight?: number): number {
  return Math.min(innerWidth, innerHeight, screenWidth || innerWidth, screenHeight || innerHeight)
}

/**
 * The same rule as an inline script for index.html's <head>: marks <html data-device="phone|pc"> before first paint,
 * so the prerendered CTA shows the right label and note before React mounts. Runs after the viewport meta tag.
 */
export const PHONE_SCRIPT = `(function(){var p=false;try{if(matchMedia('${PHONE_POINTER_QUERY}').matches){var s=window.screen||{},w=innerWidth,h=innerHeight;p=Math.min(w,h,s.width||w,s.height||h)<${PHONE_SHORT_SIDE}}}catch(e){}document.documentElement.setAttribute('data-device',p?'phone':'pc')})()`
