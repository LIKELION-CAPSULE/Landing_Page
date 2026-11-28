import { track } from './analytics.ts'
import { isPhoneDevice, PHONE_POINTER_QUERY, shortSide } from './device.ts'
import { OPEN_AT, parseAppUrl, phaseAt, stateAt, type CtaPhase, type CtaState } from './open-date.ts'

// The decision is made in the visitor's browser, never at build/prerender time: index.html's inline script
// marks <html data-cta-phase> before first paint, and useCtaState keeps it current.
export { OPEN_AT, type CtaPhase, type CtaState }
/** The phone *layout* breakpoint (CSS 767px). Not the phone/PC decision: that is lib/device.ts. */
export const MOBILE_QUERY = '(max-width: 767px)'

// QA switches exist only in local dev and Vercel preview builds, never in production.
// VITE_VERCEL_ENV comes from Vercel's automatically exposed system variables.
const QA_BUILD = import.meta.env.DEV || import.meta.env.VITE_VERCEL_ENV === 'preview'

const APP_URL = parseAppUrl(import.meta.env.VITE_APP_URL)
// The hard-coded app address is a QA convenience only; production needs a valid VITE_APP_URL.
export const APP_TARGET = APP_URL ?? (QA_BUILD ? 'https://capsule-front-web.vercel.app/login' : null)
/** Known at build time: a link can open once the date has passed. */
export const APP_READY = APP_URL !== null

function qaOverride(): string | null {
  if (!QA_BUILD || typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('cta')
}

/** before/after the opening moment (KST). QA: ?cta=before forces before; open/preparing force after. */
export function ctaPhase(now: Date | number = Date.now()): CtaPhase {
  const override = qaOverride()
  if (override === 'before') return 'before'
  if (override === 'open' || override === 'preparing') return 'after'
  return phaseAt(Number(now))
}

// Opens only when the date has passed AND the app URL is valid, so the button never
// points at a service page that is not ready yet. Set VITE_APP_URL in Vercel and redeploy to open.
// QA override (dev/preview only): ?cta=before | preparing | open
export function ctaState(now: Date | number = Date.now()): CtaState {
  const override = qaOverride()
  if (override === 'open') return APP_TARGET ? 'open' : 'preparing'
  if (override === 'before') return 'before_open'
  if (override === 'preparing') return 'preparing'
  return stateAt(Number(now), APP_URL !== null)
}

// utm_* and ref travel with every link we hand out (app login or landing share).
function withAttribution(target: URL): string {
  const incoming = new URLSearchParams(window.location.search)
  // Preserve repeated parameters and their complete values; only attribution travels.
  const keys = new Set([...incoming.keys()].filter(key => key.startsWith('utm_') || key === 'ref'))
  keys.forEach(key => target.searchParams.delete(key))
  incoming.forEach((value, key) => { if (keys.has(key)) target.searchParams.append(key, value) })
  return target.href
}

// null when no usable address exists; callers then render the locked button, never a link.
export function appUrl(): string | null {
  return APP_TARGET ? withAttribution(new URL(APP_TARGET)) : null
}

// Phones get the landing page itself: it works before the app is ready, and on PC
// its own button then shows the right state.
export function landingShareUrl(): string {
  return withAttribution(new URL('/', window.location.origin))
}

/** Phone or PC in this browser now: the app's rule (lib/device.ts), never the layout width. */
export function isPhone(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return isPhoneDevice({
    coarseNoHover: window.matchMedia(PHONE_POINTER_QUERY).matches,
    shortSidePx: shortSide(window.innerWidth, window.innerHeight, window.screen?.width, window.screen?.height),
  })
}

export type PcLinkResult = { method: 'share' | 'clipboard' | 'manual'; url: string } | { method: 'dismissed' }

export async function copyPcLink(): Promise<PcLinkResult> {
  const url = landingShareUrl()
  if (navigator.share) {
    try {
      await navigator.share({ title: '캡슐 CAPSULE', url })
      track('pc_link_copied', { method: 'share' })
      return { method: 'share', url }
    } catch (error) {
      // Closing the OS share sheet is an intentional dismissal, not a copy request.
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') return { method: 'dismissed' }
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    track('pc_link_copied', { method: 'clipboard' })
    return { method: 'clipboard', url }
  } catch {
    // The caller renders this URL as selectable text when both APIs fail.
    return { method: 'manual', url }
  }
}
