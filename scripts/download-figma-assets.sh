#!/usr/bin/env bash
# Download Figma assets; .webp targets use lossless encoding at original resolution.
# Read the latest design context first; asset URLs expire after seven days.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ "$#" -ne 1 ]; then
  echo "Usage: bash scripts/download-figma-assets.sh /absolute/path/to/figma-assets.json" >&2
  exit 2
fi

node --input-type=module - "$1" <<'NODE'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path'
import { promisify } from 'node:util'

const assets = JSON.parse(await readFile(process.argv[2], 'utf8'))
if (!Array.isArray(assets)) throw new Error('Expected an array of { url, path } entries')
const run = promisify(execFile)
if (assets.some(asset => extname(asset.path).toLowerCase() === '.webp')) {
  await run('cwebp', ['-version']).catch(() => {
    throw new Error('WebP downloads require cwebp. On macOS: brew install webp')
  })
}
const root = resolve('src/assets')
for (const asset of assets) {
  const url = new URL(asset.url)
  const target = resolve(asset.path)
  const path = relative(root, target)
  if (url.protocol !== 'https:' || url.hostname !== 'www.figma.com' || !url.pathname.startsWith('/api/mcp/asset/')) {
    throw new Error('Expected a Figma MCP asset URL')
  }
  if (!path || isAbsolute(path) || path === '..' || path.startsWith('../')) {
    throw new Error('Asset paths must be inside src/assets/')
  }
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${asset.path}`)
  let data = Buffer.from(await response.arrayBuffer())
  if (!data.length) throw new Error(`Empty asset: ${asset.path}`)
  if (extname(target).toLowerCase() === '.webp') {
    const temporary = await mkdtemp(join(tmpdir(), 'capsule-figma-'))
    try {
      const input = join(temporary, 'source')
      const output = join(temporary, 'asset.webp')
      await writeFile(input, data)
      await run('cwebp', ['-quiet', '-lossless', '-q', '75', '-m', '4', '-exact', '-metadata', 'icc', input, '-o', output])
      data = await readFile(output)
    } finally {
      await rm(temporary, { recursive: true, force: true })
    }
  }
  const previous = await readFile(target).catch(error => {
    if (error.code !== 'ENOENT') throw error
    return null
  })
  if (previous?.equals(data)) {
    console.log(`unchanged: ${asset.path}`)
    continue
  }
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, data)
  console.log(`updated: ${asset.path}`)
}
NODE
