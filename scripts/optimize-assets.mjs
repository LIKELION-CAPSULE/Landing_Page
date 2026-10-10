import { readdir, readFile, mkdir, stat } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? sourceFiles(join(directory, entry.name))
    : /\.tsx?$/.test(entry.name) ? [join(directory, entry.name)] : []))).flat()
}

// Keep source images unchanged; only imports use these delivery copies.
const images = new Set()
for (const file of await sourceFiles(join(root, 'src'))) {
  const source = await readFile(file, 'utf8')
  for (const match of source.matchAll(/assets\/(?:optimized\/)?([^'"\s]+\.webp)/g)) images.add(match[1])
}
let originalBytes = 0
let deliveryBytes = 0
for (const image of [...images].sort()) {
  // The newly supplied poster is kept in its original JPEG format.
  const original = join(root, 'src/assets', image === 'rooms/joseon.webp' ? 'rooms/joseon.jpeg' : image)
  const delivery = join(root, 'src/assets/optimized', image)
  await mkdir(dirname(delivery), { recursive: true })
  const options = ['-quiet', '-m', '6', '-sharp_yuv', '-alpha_q', '100', '-metadata', 'icc', '-exact']
  if (image === 'hero/logo.webp') options.push('-lossless', '-resize', '480', '0')
  else {
    options.push('-q', image === 'hero/study-room-preview.webp' ? '92' : image === 'story/intro-character.webp' ? '90' : '86')
    if (image === 'hero/study-room-preview.webp') options.push('-resize', '1536', '0')
    else if (image.includes('study-session/') && !image.endsWith('self-study.webp')) options.push('-resize', '1280', '0')
  }
  const result = spawnSync('cwebp', [...options, original, '-o', delivery], { encoding: 'utf8' })
  if (result.error || result.status !== 0) throw result.error ?? new Error(result.stderr)
  const before = (await stat(original)).size
  const after = (await stat(delivery)).size
  originalBytes += before
  deliveryBytes += after
  console.log(`${image}: ${before.toLocaleString()} → ${after.toLocaleString()} B`)
}
console.log(`Delivery copies: ${deliveryBytes.toLocaleString()} B; originals: ${originalBytes.toLocaleString()} B`)
