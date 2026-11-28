// Prerenders `/` into dist/index.html after `vite build` (client) and `vite build --ssr` (dist-ssr/).
// The page is the only public route: /rooms, /preorder, /done, /survey and /test are retired addresses
// that vercel.json rewrites to this same HTML (main.tsx then rewrites the URL to /), so they need no
// files of their own. Also writes the JSON-LD (Organization, WebSite, WebApplication, FAQPage).
import { readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
// PRERENDER_DIST / PRERENDER_SSR: other output folders (e.g. a development-mode build to check hydration).
const dist = process.env.PRERENDER_DIST ?? join(root, 'dist')
const ssrDir = process.env.PRERENDER_SSR ?? join(root, 'dist-ssr')
const SITE = 'https://landing.capsule.ai.kr/'

const { render, facts } = await import(pathToFileURL(join(ssrDir, 'entry-server.js')).href)
const appHtml = render()

const organization = {
  '@type': 'Organization',
  '@id': `${SITE}#organization`,
  name: '캡슐 CAPSULE',
  alternateName: 'CAPSULE',
  url: SITE,
  logo: `${SITE}favicon.svg`,
  email: facts.email,
  sameAs: [facts.instagram],
}
const website = {
  '@type': 'WebSite',
  '@id': `${SITE}#website`,
  name: '캡슐 CAPSULE',
  url: SITE,
  inLanguage: 'ko-KR',
  publisher: { '@id': `${SITE}#organization` },
}
const free = facts.beta.find(fact => fact.label === '요금')?.value === '무료'
const period = facts.beta.find(fact => fact.label === '기간')?.value
const application = {
  '@type': 'WebApplication',
  '@id': `${SITE}#app`,
  name: '캡슐 CAPSULE',
  description: `노트북 앞의 시간을 영상통화하듯 함께 보내는 AI 메이트 웹 서비스. 말을 걸면 목소리로 대답하고, 함께한 시간만큼 새 세계관이 열려요. 메이트: ${facts.mates.map(mate => mate.name).join(', ')} (AI 캐릭터).`,
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web (PC 브라우저)',
  inLanguage: 'ko-KR',
  publisher: { '@id': `${SITE}#organization` },
  ...(facts.appUrl ? { url: facts.appUrl } : {}),
  ...(free ? { offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW', description: `웹 베타${period ? ` (${period})` : ''} 무료` } } : {}),
}
const faqPage = {
  '@type': 'FAQPage',
  '@id': `${SITE}#faq`,
  inLanguage: 'ko-KR',
  mainEntity: facts.faq.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
}
const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': [organization, website, application, faqPage] }).replace(/</g, '\\u003c')

const file = join(dist, 'index.html')
let html = await readFile(file, 'utf8')
if (!html.includes('<!--app-html-->')) throw new Error('dist/index.html has no <!--app-html--> placeholder')
html = html
  .replace('<!--app-html-->', appHtml)
  .replace('<!-- structured-data -->', `<script type="application/ld+json">${jsonLd}</script>`)
await writeFile(file, html)
await rm(ssrDir, { recursive: true, force: true })
console.log(`prerendered / (${(appHtml.length / 1024).toFixed(1)} kB of HTML)`)
