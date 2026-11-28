// Login mates (API 48, public, no login): which mate gets which Aliving2D v2 model.
// Rules copied from Front_Web login-mate-source.ts / mate-source.ts (2026-11-28):
// - server names map through the catalogue (서진 → 서도현; 「말포이」 and other test mates map to none);
// - only `ALIVING2D_V2` (or a `/model.json` URL) with an engine URL qualifies;
// - an entry carrying the mate's own name wins over another name mapped to it; otherwise server order;
// - engine, player and reactions scripts load only from the asset storage's public `live2d-model` bucket.
import { mateIdForServerName, OWN_NAMES, type MateId } from './mate-names.ts'

export type LiveModel = { modelUrl: string; engineUrl: string; playerUrl: string; reactionsUrl?: string }

// Same-origin path: vercel.json (production/preview) and vite.config.ts (dev/preview) forward it to
// https://api.capsule.ai.kr/api/login-mates. The API refuses the landing's Origin, so it is never called directly.
export const LOGIN_MATES_PATH = '/api/login-mates'

const ASSET_ORIGIN = 'https://belbmclzeenlntgpekww.supabase.co'
const ASSET_PREFIX = '/storage/v1/object/public/live2d-model/'

/** https, the exact storage origin, a clean path inside the public model bucket. */
export function isAllowedAssetUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim() || value.includes('\\') || /%5c/i.test(value)) return false
  let url: URL
  try { url = new URL(value.trim()) } catch { return false }
  if (url.protocol !== 'https:' || url.username || url.password || url.origin !== ASSET_ORIGIN) return false
  if (/%(2e|2f|5c|25)/i.test(url.pathname) || url.pathname.includes('//')) return false
  return url.pathname.startsWith(ASSET_PREFIX) && url.pathname.length > ASSET_PREFIX.length
}

const isV2 = (modelUrl: string, format: unknown) => {
  const hint = typeof format === 'string' ? format.trim().toLowerCase() : ''
  if (hint === 'aliving2d_v2' || hint === 'aliving2d' || hint === 'aliving') return true
  if (hint) return false
  const clean = (modelUrl.split(/[?#]/)[0] ?? '').toLowerCase()
  return clean.endsWith('/model.json')
}

const siblingPlayer = (engineUrl: string) => engineUrl.replace(/[^/?#]*([?#].*)?$/, 'player.js$1')

type ServerMate = { name?: unknown; model?: { format?: unknown; modelJsonUrl?: unknown; engineUrl?: unknown; playerUrl?: unknown; reactionsUrl?: unknown } | null }

function modelOf(mate: ServerMate): LiveModel | null {
  const model = mate.model
  if (!model || !isAllowedAssetUrl(model.modelJsonUrl) || !isAllowedAssetUrl(model.engineUrl)) return null
  if (!isV2(model.modelJsonUrl, model.format)) return null
  const playerUrl = typeof model.playerUrl === 'string' && model.playerUrl.trim() ? model.playerUrl.trim() : siblingPlayer(model.engineUrl)
  if (!isAllowedAssetUrl(playerUrl)) return null
  return {
    modelUrl: model.modelJsonUrl.trim(),
    engineUrl: model.engineUrl.trim(),
    playerUrl,
    ...(isAllowedAssetUrl(model.reactionsUrl) ? { reactionsUrl: model.reactionsUrl.trim() } : {}),
  }
}

/** API 48 body (`{ success, data: { mates } }` or `{ mates }`) → a usable model per landing mate. */
export function liveModelsFromResponse(body: unknown, ownNames: Readonly<Record<MateId, string>> = OWN_NAMES): Partial<Record<MateId, LiveModel>> {
  const root = body && typeof body === 'object' ? body as { data?: { mates?: unknown }; mates?: unknown } : null
  const list = Array.isArray(root?.data?.mates) ? root.data.mates : Array.isArray(root?.mates) ? root.mates : []
  const result: Partial<Record<MateId, LiveModel>> = {}
  for (const id of Object.keys(ownNames) as MateId[]) {
    const mine = (list as ServerMate[]).filter(mate => mate && mateIdForServerName(mate.name) === id)
    const ordered = [...mine.filter(mate => typeof mate.name === 'string' && mate.name.trim() === ownNames[id]), ...mine.filter(mate => !(typeof mate.name === 'string' && mate.name.trim() === ownNames[id]))]
    for (const mate of ordered) {
      const model = modelOf(mate)
      if (model) { result[id] = model; break }
    }
  }
  return result
}

let request: Promise<unknown> | null = null
/**
 * One GET per page. A failure is forgotten so a later attempt can retry.
 * Cookies follow the default (`same-origin`): the path is same-origin only, and a protected Vercel preview
 * needs its access cookie, or the request is redirected to vercel.com/sso-api and fails CORS.
 */
export function fetchLoginMates(): Promise<unknown> {
  request ??= fetch(LOGIN_MATES_PATH, { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
    .then(response => { if (!response.ok) throw new Error(`login-mates ${response.status}`); return response.json() as Promise<unknown> })
    .catch(error => { request = null; throw error })
  return request
}
