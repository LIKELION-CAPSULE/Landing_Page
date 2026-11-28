// Writes each pixel picture of src/components/pixel/pixel-art.ts to src/assets/pixel/<name>.svg
// (one rect per same-colour run, crisp edges), so pages reference small files instead of inlining
// data URLs in every element. Run after changing pixel-art.ts: node scripts/build-pixel-art.mjs
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const { PIXEL_ART, PIXEL_DIGITS } = await import(join(root, 'src/components/pixel/pixel-art.ts'))
const out = join(root, 'src/assets/pixel')
await mkdir(out, { recursive: true })

function svg(art) {
  const rects = []
  art.rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const cell = row[x]
      let end = x + 1
      while (end < row.length && row[end] === cell) end++
      const fill = art.palette[cell]
      if (cell !== '.' && fill) rects.push(`<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${fill}"/>`)
      x = end
    }
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${art.rows[0].length} ${art.rows.length}" shape-rendering="crispEdges">${rects.join('')}</svg>\n`
}

const entries = [...Object.entries(PIXEL_ART), ...PIXEL_DIGITS.map((art, index) => [`digit-${index + 1}`, art])]
for (const [name, art] of entries) await writeFile(join(out, `${name}.svg`), svg(art))
console.log(`wrote ${entries.length} pixel pictures to src/assets/pixel/`)
