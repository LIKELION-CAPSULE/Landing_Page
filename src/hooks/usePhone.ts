import { useEffect, useSyncExternalStore } from 'react'
import { isPhone } from '../lib/cta.ts'
import { PHONE_POINTER_QUERY } from '../lib/device.ts'

const subscribe = (change: () => void) => {
  const pointer = window.matchMedia(PHONE_POINTER_QUERY)
  pointer.addEventListener('change', change)
  // Rotation and window resizes change the short side.
  window.addEventListener('resize', change)
  return () => {
    pointer.removeEventListener('change', change)
    window.removeEventListener('resize', change)
  }
}

// Phone or PC (lib/device.ts), prerender-safe: the prerendered HTML and hydration render false (PC) and CSS shows
// the right state from <html data-device>, set by index.html's inline script before paint; after mount React
// re-renders with the real value and keeps that attribute current.
export function usePhone(): boolean {
  const phone = useSyncExternalStore(subscribe, isPhone, () => false)
  // Read the browser, not `phone`: on the hydration commit `phone` is still the server value (false).
  useEffect(() => { document.documentElement.dataset.device = isPhone() ? 'phone' : 'pc' }, [phone])
  return phone
}
