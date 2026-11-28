// The link preview image referenced by index.html exists, is a 1200 × 630 JPEG and stays light.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'

function jpegSize(jpeg: Buffer) {
  assert.equal(jpeg.readUInt16BE(0), 0xFFD8, 'JPEG start')
  for (let at = 2; at < jpeg.length;) {
    const marker = jpeg.readUInt16BE(at)
    const length = jpeg.readUInt16BE(at + 2)
    if (marker >= 0xFFC0 && marker <= 0xFFC3) return [jpeg.readUInt16BE(at + 7), jpeg.readUInt16BE(at + 5)]
    at += 2 + length
  }
  throw new Error('no SOF marker')
}

test('og:image and twitter:image point at the same 1200 × 630 JPEG under 300 kB', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  const og = html.match(/<meta property="og:image" content="https:\/\/landing\.capsule\.ai\.kr\/(images\/[^"]+)" \/>/)?.[1]
  const twitter = html.match(/<meta name="twitter:image" content="https:\/\/landing\.capsule\.ai\.kr\/(images\/[^"]+)" \/>/)?.[1]
  assert.ok(og)
  assert.equal(twitter, og)
  const file = new URL(`../public/${og}`, import.meta.url)
  assert.ok(existsSync(file), og)
  assert.deepEqual(jpegSize(readFileSync(file)), [1200, 630])
  assert.ok(statSync(file).size < 300 * 1024)
  assert.match(html, /og:image:alt" content="[^"]*나만의 AI 메이트와, 영상통화하듯 함께/)
})
