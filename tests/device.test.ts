import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runInNewContext } from 'node:vm'
import { isPhoneDevice, PHONE_SCRIPT, shortSide } from '../src/lib/device.ts'

// Each case: the pointer, the viewport and the screen as a browser reports them.
type Device = { name: string; coarseNoHover: boolean; inner: [number, number]; screen: [number, number]; phone: boolean }
const DEVICES: Device[] = [
  { name: 'PC 1440 window', coarseNoHover: false, inner: [1440, 900], screen: [1440, 900], phone: false },
  { name: 'PC window narrowed to 700', coarseNoHover: false, inner: [700, 860], screen: [1440, 900], phone: false },
  { name: 'PC window narrowed to 640 (the old 767px rule called this a phone)', coarseNoHover: false, inner: [640, 860], screen: [1440, 900], phone: false },
  { name: 'PC window squeezed to 500 × 400', coarseNoHover: false, inner: [500, 400], screen: [1440, 900], phone: false },
  { name: 'touch laptop (coarse pointer, but hovers with a trackpad)', coarseNoHover: false, inner: [1280, 800], screen: [1280, 800], phone: false },
  { name: 'iPhone portrait 390 × 844', coarseNoHover: true, inner: [390, 664], screen: [390, 844], phone: true },
  { name: 'iPhone landscape 852 × 393 (the old rule sent it to the app)', coarseNoHover: true, inner: [852, 393], screen: [393, 852], phone: true },
  { name: 'Android landscape 915 × 412', coarseNoHover: true, inner: [915, 360], screen: [412, 915], phone: true },
  { name: 'iPad portrait 820 × 1180', coarseNoHover: true, inner: [820, 1180], screen: [820, 1180], phone: false },
  { name: 'iPad mini landscape 1133 × 744', coarseNoHover: true, inner: [1133, 744], screen: [744, 1133], phone: false },
]

test('phone or PC: touch-only pointer and short side < 600px, never the width alone (app isPhoneDevice)', () => {
  for (const device of DEVICES) {
    const shortSidePx = shortSide(...device.inner, ...device.screen)
    assert.equal(isPhoneDevice({ coarseNoHover: device.coarseNoHover, shortSidePx }), device.phone, device.name)
  }
  assert.equal(isPhoneDevice({ coarseNoHover: true, shortSidePx: 599 }), true)
  assert.equal(isPhoneDevice({ coarseNoHover: true, shortSidePx: 600 }), false)
  // No screen size reported: the viewport alone.
  assert.equal(shortSide(852, 393, 0, 0), 393)
})

test('the inline <head> script marks <html data-device> with the same rule', () => {
  for (const device of DEVICES) {
    const attributes: Record<string, string> = {}
    runInNewContext(PHONE_SCRIPT, {
      window: { screen: { width: device.screen[0], height: device.screen[1] } },
      innerWidth: device.inner[0],
      innerHeight: device.inner[1],
      matchMedia: (query: string) => ({ matches: query === '(pointer: coarse) and (hover: none)' && device.coarseNoHover }),
      document: { documentElement: { setAttribute: (name: string, value: string) => { attributes[name] = value } } },
    })
    assert.equal(attributes['data-device'], device.phone ? 'phone' : 'pc', device.name)
  }
})

test('the inline script falls back to PC when matchMedia is missing', () => {
  const attributes: Record<string, string> = {}
  runInNewContext(PHONE_SCRIPT, { window: {}, innerWidth: 390, innerHeight: 844, document: { documentElement: { setAttribute: (name: string, value: string) => { attributes[name] = value } } } })
  assert.equal(attributes['data-device'], 'pc')
})
