import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchLoginMates, isAllowedAssetUrl, liveModelsFromResponse, LOGIN_MATES_PATH } from '../src/lib/live2d/source.ts'
import { mateIdForServerName } from '../src/lib/live2d/mate-names.ts'
import { CLOSE_UP_TALL, CLOSE_UP_WIDE, closeUpK, closeUpStillCss, closeUpView, HERO_RENDER } from '../src/lib/live2d/view.ts'

const BUCKET = 'https://belbmclzeenlntgpekww.supabase.co/storage/v1/object/public/live2d-model'
const v2 = (path: string) => ({
  format: 'ALIVING2D_V2', modelJsonUrl: `${BUCKET}/${path}/model.json`, scale: 1, offsetX: 0, offsetY: 0,
  engineUrl: `${BUCKET}/aliving2d/v2/engine.js`, playerUrl: `${BUCKET}/aliving2d/v2/player.js`, reactionsUrl: `${BUCKET}/aliving2d/v2/reactions.json`,
})
// API 48 as production answered on 2026-11-28 (shape and order).
const PRODUCTION = { success: true, data: { mates: [
  { id: 1, name: '말포이', ageRating: 'ALL', cardImageUrl: null, model: { format: 'CUBISM', modelJsonUrl: `${BUCKET}/chaerin/v3/chaerin.model3.json`, engineUrl: null, playerUrl: null, reactionsUrl: null } },
  { id: 2, name: '서진', ageRating: 'ALL', model: v2('seojin/v5') },
  { id: 3, name: '서진', ageRating: 'ALL', model: v2('seojin/v4') },
  { id: 4, name: '채린', ageRating: 'ALL', model: v2('chaerin/v5') },
] } }

test('server names map like the app catalogue', () => {
  assert.equal(mateIdForServerName('채린'), 'chaerin')
  assert.equal(mateIdForServerName('서진'), 'dohyun')
  assert.equal(mateIdForServerName(' 서 도현 '), 'dohyun')
  assert.equal(mateIdForServerName('말포이'), undefined)
  assert.equal(mateIdForServerName(null), undefined)
})

test('production 48: 채린 v5, 서도현 = first 서진 (v5); the Cubism test mate is ignored', () => {
  const models = liveModelsFromResponse(PRODUCTION)
  assert.equal(models.chaerin?.modelUrl, `${BUCKET}/chaerin/v5/model.json`)
  assert.equal(models.dohyun?.modelUrl, `${BUCKET}/seojin/v5/model.json`)
  assert.equal(models.chaerin?.engineUrl, `${BUCKET}/aliving2d/v2/engine.js`)
})

test('an entry with the mate\'s own name wins over another mapped name', () => {
  const models = liveModelsFromResponse({ mates: [{ name: '서진', model: v2('seojin/v5') }, { name: '서도현', model: v2('dohyun/v9') }] })
  assert.equal(models.dohyun?.modelUrl, `${BUCKET}/dohyun/v9/model.json`)
})

test('no engine, a foreign script origin or a malformed body: no live model (the still stays)', () => {
  assert.deepEqual(liveModelsFromResponse({ mates: [{ name: '채린', model: { ...v2('chaerin/v5'), engineUrl: null } }] }), {})
  assert.deepEqual(liveModelsFromResponse({ mates: [{ name: '채린', model: { ...v2('chaerin/v5'), engineUrl: 'https://evil.example/engine.js' } }] }), {})
  assert.deepEqual(liveModelsFromResponse({ mates: [{ name: '채린', model: { ...v2('chaerin/v5'), playerUrl: `${BUCKET}/../x/player.js` } }] }).chaerin, undefined)
  assert.deepEqual(liveModelsFromResponse(null), {})
  assert.deepEqual(liveModelsFromResponse({ data: { mates: 'x' } }), {})
})

test('asset allowlist: exact origin and bucket, https, no encoded traversal', () => {
  assert.equal(isAllowedAssetUrl(`${BUCKET}/aliving2d/v2/engine.js`), true)
  assert.equal(isAllowedAssetUrl(`${BUCKET.replace('https', 'http')}/aliving2d/v2/engine.js`), false)
  assert.equal(isAllowedAssetUrl('https://belbmclzeenlntgpekww.supabase.co/storage/v1/object/public/other/engine.js'), false)
  assert.equal(isAllowedAssetUrl(`${BUCKET}/%2e%2e/engine.js`), false)
  assert.equal(isAllowedAssetUrl(`${BUCKET}/`), false)
})

// Evaluate the CSS still box (container units) numerically for a stage of cw × ch.
function cssBox(framing: typeof CLOSE_UP_WIDE, cw: number, ch: number) {
  const css = closeUpStillCss(framing)
  const evaluate = (expression: string) => Function('cqw', 'cqh', 'min', `return ${expression.replace(/calc\(/g, '(').replace(/(\d+(?:\.\d+)?)cq([wh])/g, '($1 * cq$2)')}`)(cw / 100, ch / 100, Math.min) as number
  return { left: evaluate(css.left), top: evaluate(css.top), width: evaluate(css.width), height: evaluate(css.height) }
}
// Where the engine draws the hero still's rectangle for a view.
function engineBox(cw: number, ch: number, framing: typeof CLOSE_UP_WIDE) {
  const view = closeUpView(cw, ch, framing)
  const k = (Math.min(cw, ch) / 1280) * view.zoom
  const kRender = (HERO_RENDER.size.width / 1280) * HERO_RENDER.view.zoom
  const left = HERO_RENDER.view.cx - HERO_RENDER.size.width / 2 / kRender
  const top = HERO_RENDER.view.cy - HERO_RENDER.size.height / 2 / kRender
  return { left: cw / 2 + (left - view.cx) * k, top: ch / 2 + (top - view.cy) * k, width: HERO_RENDER.size.width / kRender * k, height: HERO_RENDER.size.height / kRender * k, k }
}

test('prerendered still and live model land on the same pixels (close-up)', () => {
  for (const [framing, sizes] of [[CLOSE_UP_WIDE, [[1440, 900], [1280, 800], [1920, 960], [1024, 640]]], [CLOSE_UP_TALL, [[390, 506], [768, 1100], [360, 440]]]] as const) {
    for (const [cw, ch] of sizes) {
      const a = cssBox(framing, cw, ch), b = engineBox(cw, ch, framing)
      assert.ok(Math.abs(b.k - closeUpK(cw, ch, framing)) < 1e-9)
      for (const key of ['left', 'top', 'width', 'height'] as const) assert.ok(Math.abs(a[key] - b[key]) < 0.5, `${cw}×${ch} ${key}: css ${a[key]} vs engine ${b[key]}`)
    }
  }
})

test('48 is called on the same-origin path with same-origin cookies (protected Vercel previews need theirs)', async () => {
  const calls: { url: unknown; init: RequestInit | undefined }[] = []
  const original = globalThis.fetch
  globalThis.fetch = (async (url: unknown, init?: RequestInit) => {
    calls.push({ url, init })
    return new Response(JSON.stringify({ mates: [] }), { status: 200 })
  }) as typeof fetch
  try {
    assert.deepEqual(await fetchLoginMates(), { mates: [] })
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, LOGIN_MATES_PATH)
    assert.equal(LOGIN_MATES_PATH.startsWith('/'), true)
    assert.equal(calls[0].init?.credentials, 'same-origin')
  } finally {
    globalThis.fetch = original
  }
})
