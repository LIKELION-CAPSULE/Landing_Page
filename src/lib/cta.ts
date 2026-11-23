import { track } from './analytics.ts'

export const OPEN_AT = new Date('2026-12-01T00:00:00+09:00').getTime()
export const MOBILE_QUERY = '(max-width: 767px)'

export function isOpen(now: Date | number = Date.now()): boolean {
  const override = new URLSearchParams(window.location.search).get('cta')
  if (override === 'open') return true
  if (override === 'before') return false
  return Number(now) >= OPEN_AT
}

export function appUrl(): string {
  const url = new URL(import.meta.env.VITE_APP_URL || 'https://capsule-front-web.vercel.app/login')
  const incoming = new URLSearchParams(window.location.search)
  // Preserve repeated parameters and their complete values; only attribution travels to the app.
  const keys = new Set([...incoming.keys()].filter(key => key.startsWith('utm_') || key === 'ref'))
  keys.forEach(key => url.searchParams.delete(key))
  incoming.forEach((value, key) => { if (keys.has(key)) url.searchParams.append(key, value) })
  return url.href
}

export function isMobile(): boolean {
  // Match the landing's 767px phone layout. Coarse pointers also occur on PC-sized
  // touch laptops/tablets, so pointer type alone must not hide the desktop app link.
  return window.matchMedia(MOBILE_QUERY).matches
}

export type PcLinkResult = { method: 'share' | 'clipboard' | 'manual'; url: string } | { method: 'dismissed' }

export async function copyPcLink(): Promise<PcLinkResult> {
  const url = appUrl()
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
