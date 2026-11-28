// Still images of the 404 scene (the same frame the live scene starts from): what the page shows before the 3D is
// ready and whenever it cannot run: the 1760 × 540 stage around the 880 × 400 box, at 1x and 2x, WebP with
// transparency, from the real scene code.
//   node scripts/build-404-still.mjs            (CHROME=/path/to/chrome to choose the browser)
// No new dependency: Vite's own dev server serves /nope?nf-still (capture mode, development only) and an installed
// Chrome renders it headless; the canvas is read over the DevTools protocol (Node's built-in WebSocket).
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'src/assets/not-found')
const chrome = [process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/usr/bin/google-chrome', '/usr/bin/chromium']
  .find(path => path && existsSync(path))
if (!chrome) throw new Error('Chrome not found: set CHROME=/path/to/chrome')

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

async function devtools(port) {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`)
      if (response.ok) return
    } catch { /* Not up yet. */ }
    await delay(100)
  }
  throw new Error('Chrome DevTools did not start')
}

/** One page target driven over CDP. */
async function openPage(port) {
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
  const socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
  let id = 0
  const pending = new Map()
  socket.onmessage = event => {
    const message = JSON.parse(event.data)
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id)
      pending.delete(message.id)
      if (message.error) reject(new Error(message.error.message))
      else resolve(message.result)
    }
  }
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const message = { id: ++id, method, params }
    pending.set(message.id, { resolve, reject })
    socket.send(JSON.stringify(message))
  })
  return { send, close: () => socket.close() }
}

async function capture(port, url, scale) {
  const page = await openPage(port)
  try {
    await page.send('Emulation.setDeviceMetricsOverride', { width: 880, height: 400, deviceScaleFactor: scale, mobile: false })
    await page.send('Page.navigate', { url })
    for (let attempt = 0; attempt < 200; attempt++) {
      const { result } = await page.send('Runtime.evaluate', { expression: 'typeof window.__notFoundStill === "function"', returnByValue: true })
      if (result.value) break
      await delay(100)
    }
    // A couple of frames after the first one, so every program is warm.
    await delay(400)
    const { result } = await page.send('Runtime.evaluate', { expression: 'window.__notFoundStill()', returnByValue: true })
    if (typeof result.value !== 'string' || !result.value.startsWith('data:image/webp')) throw new Error('No still image from the page')
    return Buffer.from(result.value.split(',')[1], 'base64')
  } finally {
    page.close()
  }
}

const server = await createServer({ root, logLevel: 'silent', server: { port: 0, strictPort: false } })
await server.listen()
const address = server.httpServer.address()
const url = `http://localhost:${address.port}/nope?nf-still`
const profile = mkdtempSync(join(tmpdir(), 'capsule-404-still-'))
const port = 9300 + Math.floor(Math.random() * 500)
const browser = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--hide-scrollbars', '--no-first-run', '--ignore-gpu-blocklist', 'about:blank'], { stdio: 'ignore' })
try {
  await devtools(port)
  mkdirSync(out, { recursive: true })
  for (const [scale, name] of [[1, 'broken-capsule.webp'], [2, 'broken-capsule@2x.webp']]) {
    const image = await capture(port, url, scale)
    writeFileSync(join(out, name), image)
    console.log(`wrote src/assets/not-found/${name} (${1760 * scale}×${540 * scale}, ${(image.length / 1024).toFixed(0)} kB)`)
  }
} finally {
  const exited = new Promise(resolve => browser.once('exit', resolve))
  browser.kill()
  await exited
  await server.close()
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
}
