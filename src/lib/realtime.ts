type NetworkInfo = { saveData?: boolean; effectiveType?: string }

/**
 * Whether this visitor gets realtime WebGL (the hero's Live2D mate, the 404 scene). Otherwise a still image stays
 * (and is the LCP): reduced motion, data saver, slow connections, low-end devices, no WebGL2.
 * QA: `?live=0` never, `?live=1` skips the device checks (reduced motion still wins). Browser only.
 */
export function realtimeAllowed(): boolean {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  const query = new URLSearchParams(window.location.search).get('live')
  if (query === '0') return false
  if (query !== '1') {
    const nav = navigator as Navigator & { connection?: NetworkInfo; deviceMemory?: number }
    if (nav.connection?.saveData) return false
    if (nav.connection?.effectiveType && ['slow-2g', '2g', '3g'].includes(nav.connection.effectiveType)) return false
    if ((nav.hardwareConcurrency ?? 8) < 4) return false
    if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return false
  }
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  } catch { return false }
  return true
}
