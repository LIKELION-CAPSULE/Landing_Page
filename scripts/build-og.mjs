// Link preview image (Open Graph / X), 1200 × 630, from an HTML composition of the landing's first screen:
// the colour logo v2, the headline, and a video call with 채린 (and 서도현 in a small tile).
//   node scripts/build-og.mjs            (CHROME=/path/to/chrome to choose the browser)
// No new dependency: an installed Chrome renders the PNG, macOS `sips` encodes the JPEG.
// The file name carries a version (capsule-og-v2.jpg): KakaoTalk and others cache previews by image URL.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public/images/capsule-og-v2.jpg')
const QUALITY = 82
const asset = (path) => pathToFileURL(join(root, 'src/assets', path)).href

const chrome = [process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/usr/bin/google-chrome', '/usr/bin/chromium']
  .find(path => path && existsSync(path))
if (!chrome) throw new Error('Chrome not found: set CHROME=/path/to/chrome')

const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>
@font-face { font-family: "OG Sans"; src: url("${asset('fonts/PretendardVariable.woff2')}") format("woff2"); font-weight: 45 920; }
* { box-sizing: border-box; margin: 0; }
html, body { width: 1200px; height: 630px; overflow: hidden; background: #0F0E17; font-family: "OG Sans", sans-serif; color: #FAFAFD; }
.og { position: relative; width: 1200px; height: 630px; overflow: hidden;
  background: radial-gradient(70% 90% at 78% 40%, rgba(126, 84, 246, .26), transparent 70%), #0F0E17; }
.copy { position: absolute; left: 72px; top: 0; bottom: 0; width: 520px; display: flex; flex-direction: column; justify-content: center; }
.logo { width: 196px; height: auto; margin-bottom: 44px; }
h1 { font-size: 60px; line-height: 1.22; font-weight: 750; letter-spacing: -0.045em; word-break: keep-all; }
h1 span { display: block; }
p { margin-top: 24px; font-size: 24px; line-height: 1.5; color: #CAC9D4; letter-spacing: -0.01em; }
p b { color: #C4B9F3; font-weight: 650; }
/* The call: one big tile (채린) and a small one (서도현), like the first screen's close-up. */
.tile { position: absolute; overflow: hidden; border-radius: 28px; background: #191823; box-shadow: 0 24px 60px rgba(0, 0, 0, .45); }
.tile .room { position: absolute; inset: -8px; width: calc(100% + 16px); height: calc(100% + 16px); object-fit: cover; filter: blur(3px) brightness(.66) saturate(1.1); }
.tile .mate { position: absolute; left: 50%; transform: translateX(-50%); max-width: none; }
.main { left: 618px; top: 46px; width: 520px; height: 538px; }
.main .mate { top: -6px; width: 860px; }
.pip { left: 958px; top: 372px; width: 200px; height: 222px; border-radius: 20px; outline: 3px solid #0F0E17; }
.pip .mate { top: 2px; width: 380px; }
.chip { position: absolute; display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 999px; background: rgba(25, 24, 35, .9); font-size: 17px; font-weight: 600; white-space: nowrap; }
.chip i { width: 9px; height: 9px; border-radius: 50%; background: #5BE09C; }
.chip small { color: #A4A3B0; font-size: 15px; font-weight: 500; }
.main .chip { left: 18px; top: 18px; }
.main .ai { left: auto; right: 18px; color: #CAC9D4; font-size: 15px; }
.pip .chip { left: 10px; bottom: 10px; padding: 6px 10px; font-size: 14px; }
.pip .chip i { width: 7px; height: 7px; }
</style></head><body><div class="og">
  <div class="copy">
    <img class="logo" src="${asset('brand/capsule-horizontal-color.svg')}" alt="">
    <h1><span>나만의 AI 메이트와,</span><span>영상통화하듯 함께</span></h1>
    <p>말을 걸면 목소리로 대답하는<br>AI 메이트 <b>채린</b> · <b>서도현</b></p>
  </div>
  <div class="tile main">
    <img class="room" src="${asset('scene/chaerin-call-bg-landscape.webp')}" alt="">
    <img class="mate" src="${asset('mates/chaerin/chaerin-v2-hero.webp')}" alt="">
    <span class="chip"><i></i>채린<small>같은 반 짝꿍</small></span>
    <span class="chip ai">AI 캐릭터</span>
  </div>
  <div class="tile pip">
    <img class="room" src="${asset('scene/chaerin-call-bg-landscape.webp')}" alt="">
    <img class="mate" src="${asset('mates/dohyun/dohyun-hero.webp')}" alt="">
    <span class="chip"><i></i>서도현</span>
  </div>
</div></body></html>`

const work = mkdtempSync(join(tmpdir(), 'capsule-og-'))
try {
  const page = join(work, 'og.html'), png = join(work, 'og.png')
  writeFileSync(page, html)
  spawnSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1200,630', '--virtual-time-budget=3000', `--screenshot=${png}`, pathToFileURL(page).href], { encoding: 'utf8' })
  if (!existsSync(png)) throw new Error('Chrome did not render the OG image')
  const sips = spawnSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(QUALITY), png, '--out', out], { encoding: 'utf8' })
  if (sips.status !== 0) throw new Error(`sips failed: ${sips.stderr}`)
  const dims = spawnSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', out], { encoding: 'utf8' }).stdout
  if (!/pixelWidth: 1200/.test(dims) || !/pixelHeight: 630/.test(dims)) throw new Error(`unexpected size: ${dims}`)
  console.log(`wrote public/images/capsule-og-v2.jpg (1200×630, ${(statSync(out).size / 1024).toFixed(0)} kB, quality ${QUALITY})`)
} finally {
  rmSync(work, { recursive: true, force: true })
}
