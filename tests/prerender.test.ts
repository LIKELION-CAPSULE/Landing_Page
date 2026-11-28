// Checks the built page as a crawler without JavaScript reads it (run after `npm run build`; skipped otherwise).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const file = new URL('../dist/index.html', import.meta.url)
const built = existsSync(file)
const html = built ? readFileSync(file, 'utf8') : ''
const text = (fragment: string) => fragment.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
const all = (tag: string) => [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'g'))].map(match => text(match[1]))

test('prerendered HTML carries the real content', { skip: !built && 'dist/index.html not built' }, () => {
  assert.deepEqual(all('h1'), ['나만의 AI 메이트와, 영상통화하듯 함께'])
  const h2 = all('h2')
  for (const heading of ['오늘 연결할 메이트', '웹 베타에서 먼저 만나요']) assert.ok(h2.includes(heading), heading)
  const h3 = all('h3')
  for (const name of ['강채린', '서도현']) assert.ok(h3.includes(name), name)
  assert.match(html, /id="chaerin"/)
  assert.match(html, /id="dohyun"/)
  assert.match(html, /AI 캐릭터/)
  assert.ok(!html.includes('<!--app-html-->'))
})

test('JSON-LD FAQ is exactly the visible FAQ', { skip: !built && 'dist/index.html not built' }, () => {
  const json = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)?.[1]
  assert.ok(json, 'JSON-LD present')
  const graph = JSON.parse(json!)['@graph'] as { '@type': string; mainEntity?: { name: string; acceptedAnswer: { text: string } }[] }[]
  assert.deepEqual(graph.map(node => node['@type']), ['Organization', 'WebSite', 'WebApplication', 'FAQPage'])
  const faq = graph.find(node => node['@type'] === 'FAQPage')!.mainEntity!
  const summaries = all('summary')
  const answers = [...html.matchAll(/<details[^>]*><summary>[\s\S]*?<\/summary><p>([\s\S]*?)<\/p><\/details>/g)].map(match => text(match[1]))
  assert.deepEqual(faq.map(item => item.name), summaries)
  assert.deepEqual(faq.map(item => item.acceptedAnswer.text), answers)
})

test('the CTA phase is decided in the browser, not baked into the HTML', { skip: !built && 'dist/index.html not built' }, () => {
  assert.match(html, /setAttribute\('data-cta-phase'/)
  assert.ok(!/<html[^>]*data-cta-phase/.test(html))
  assert.match(html, /data-active="pending"/)
})

const notFoundFile = new URL('../dist/404.html', import.meta.url)
test('404.html: the not-found page, prerendered, noindex, without the landing\'s canonical and structured data', { skip: !existsSync(notFoundFile) && 'dist/404.html not built' }, () => {
  const page = readFileSync(notFoundFile, 'utf8')
  assert.match(page, /<title>캡슐 CAPSULE · 페이지를 찾을 수 없어요<\/title>/)
  assert.match(page, /<meta name="robots" content="noindex" \/>/)
  assert.match(page, /<div id="root" data-page="not-found">/)
  assert.match(page, /<h1>이 페이지를 찾을 수 없어요<\/h1>/)
  assert.match(page, /href="\/">홈으로<\/a>/)
  assert.match(page, /CAPSULE 시작하기/)
  assert.match(page, /setAttribute\('data-cta-phase'/)
  assert.ok(!page.includes('rel="canonical"'))
  assert.ok(!page.includes('application/ld+json'))
  assert.ok(!/<link rel="preload" as="image"[^>]*fetchpriority/.test(page))
  assert.ok(!page.includes('<!--app-html-->'))
  // The 3D scene's still image is in the HTML (shown before JavaScript, and whenever the 3D cannot run).
  assert.match(page, /<img class="nf-still" src="\/assets\/broken-capsule-[^"]+\.webp" srcSet="[^"]+ 1760w, [^"]+broken-capsule@2x-[^"]+\.webp 3520w"/)
})
