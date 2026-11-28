// Raster app icons from the CAPSULE logo v2 symbol (public/favicon.svg — the same file as Front_Web
// design/brand/capsule-logo-2026-11-22-v2/capsule-symbol-color.svg). No new dependency: an installed Chrome
// (headless) rasterises each size directly, and the ICO container is written here.
//   node scripts/build-icons.mjs            (CHROME=/path/to/chrome to choose the browser)
// Writes to public/: favicon.ico (16·32·48), apple-touch-icon.png (180, full-bleed tile: iOS rounds the corners
// itself), icon-192.png · icon-512.png (the rounded tile, transparent corners), icon-maskable-512.png (full-bleed,
// the capsule well inside the 80 % safe circle).
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pub = join(root, 'public')
const source = readFileSync(join(pub, 'favicon.svg'), 'utf8')

const chrome = [process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/usr/bin/google-chrome', '/usr/bin/chromium']
  .find(path => path && existsSync(path))
if (!chrome) throw new Error('Chrome not found: set CHROME=/path/to/chrome')

// The symbol: a 472 × 456 rounded tile, the capsule (three paths) in its middle.
const viewBox = source.match(/viewBox="([^"]+)"/)?.[1]
const defs = source.match(/<defs>[\s\S]*<\/defs>/)?.[0]
const paths = [...source.matchAll(/<path [^>]*\/>/g)].map(match => match[0])
if (viewBox !== '0 0 472 456' || !defs || paths.length !== 4) throw new Error('public/favicon.svg is not the expected logo v2 symbol')
const [tile, ...capsule] = paths
const tileFill = tile.match(/fill="([^"]+)"/)[1]

/** The rounded tile centred in a square (transparent corners): favicons and the manifest's `any` icons. */
const roundedSquare = source.replace(`viewBox="${viewBox}"`, 'viewBox="0 -8 472 472"')
/**
 * Full bleed: the tile colour fills the square (iOS and maskable launchers cut their own corners), the capsule
 * centred at the same size as on the tile (its half-diagonal ≈ 28 % of the side, inside the 40 % safe radius).
 * The capsule's centre in the symbol is (242.6, 236.7).
 */
const fullBleed = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 472 472" fill="none">${defs}<rect width="472" height="472" fill="${tileFill}"/><g transform="translate(-6.6 -0.7)">${capsule.join('')}</g></svg>`

const work = mkdtempSync(join(tmpdir(), 'capsule-icons-'))
function render(svg, size, name) {
  const svgFile = join(work, `${name}.svg`)
  const htmlFile = join(work, `${name}.html`)
  const pngFile = join(work, `${name}.png`)
  writeFileSync(svgFile, svg)
  writeFileSync(htmlFile, `<!doctype html><style>html,body{margin:0;background:transparent;overflow:hidden}img{display:block;width:${size}px;height:${size}px}</style><img src="${pathToFileURL(svgFile).href}">`)
  const result = spawnSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000', '--force-device-scale-factor=1', `--window-size=${size},${size}`, `--screenshot=${pngFile}`, pathToFileURL(htmlFile).href], { encoding: 'utf8' })
  if (!existsSync(pngFile)) throw new Error(`Chrome did not render ${name}: ${result.stderr}`)
  const png = readFileSync(pngFile)
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20)
  if (width !== size || height !== size) throw new Error(`${name}: ${width}×${height}, expected ${size}×${size}`)
  return png
}

/** ICO with PNG entries (supported by every current browser and Windows Vista+). */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length)
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4)
  let offset = header.length
  images.forEach(({ size, png }, index) => {
    const at = 6 + 16 * index
    header.writeUInt8(size >= 256 ? 0 : size, at); header.writeUInt8(size >= 256 ? 0 : size, at + 1)
    header.writeUInt8(0, at + 2); header.writeUInt8(0, at + 3)
    header.writeUInt16LE(1, at + 4); header.writeUInt16LE(32, at + 6)
    header.writeUInt32LE(png.length, at + 8); header.writeUInt32LE(offset, at + 12)
    offset += png.length
  })
  return Buffer.concat([header, ...images.map(image => image.png)])
}

try {
  const favicons = [16, 32, 48].map(size => ({ size, png: render(roundedSquare, size, `favicon-${size}`) }))
  writeFileSync(join(pub, 'favicon.ico'), ico(favicons))
  writeFileSync(join(pub, 'apple-touch-icon.png'), render(fullBleed, 180, 'apple-touch-icon'))
  writeFileSync(join(pub, 'icon-192.png'), render(roundedSquare, 192, 'icon-192'))
  writeFileSync(join(pub, 'icon-512.png'), render(roundedSquare, 512, 'icon-512'))
  writeFileSync(join(pub, 'icon-maskable-512.png'), render(fullBleed, 512, 'icon-maskable-512'))
  console.log('wrote public/favicon.ico (16, 32, 48), apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png')
} finally {
  rmSync(work, { recursive: true, force: true })
}
