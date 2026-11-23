import { track } from './analytics.ts'

export const OPEN_AT = new Date('2026-12-01T00:00:00+09:00').getTime()
export const MOBILE_QUERY = '(max-width: 767px)'

export type CtaState = 'before_open' | 'preparing' | 'open'

const APP_URL = import.meta.env.VITE_APP_URL as string | undefined

// Opens only when the date has passed AND the app URL is configured, so the button never
// points at a service page that is not ready yet. Set VITE_APP_URL in Vercel and redeploy to open.
// QA override: ?cta=before | preparing | open
export function ctaState(now: Date | number = Date.now()): CtaState {
  const override = new URLSearchParams(window.location.search).get('cta')
  if (override === 'open') return 'open'
  if (override === 'before') return 'before_open'
  if (override === 'preparing') return 'preparing'
  if (Number(now) < OPEN_AT) return 'before_open'
  return APP_URL ? 'open' : 'preparing'
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

export function appUrl(): string {
  return withAttribution(new URL(APP_URL || 'https://capsule-front-web.vercel.app/login'))
}

// Phones get the landing page itself: it works before the app is ready, and on PC
// its own button then shows the right state.
export function landingShareUrl(): string {
  return withAttribution(new URL('/', window.location.origin))
}

export function isMobile(): boolean {
  // Match the landing's 767px phone layout. Coarse pointers also occur on PC-sized
  // touch laptops/tablets, so pointer type alone must not hide the desktop app link.
  return window.matchMedia(MOBILE_QUERY).matches
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
