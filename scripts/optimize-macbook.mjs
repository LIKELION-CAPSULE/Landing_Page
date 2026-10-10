import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer'

// Compress raw buffers without quantization, simplification, or texture changes.
// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_meshopt_compression
const sourceURL = new URL('../public/models/macbook_web_ready.glb', import.meta.url)
const outputURL = new URL('../public/models/macbook_web_optimized.glb', import.meta.url)
const reportURL = new URL('../docs/macbook-model-optimization-report.json', import.meta.url)
const extension = 'EXT_meshopt_compression'
const source = await readFile(sourceURL)
assert.equal(source.readUInt32LE(0), 0x46546c67)
assert.equal(source.readUInt32LE(4), 2)
assert.equal(source.readUInt32LE(8), source.length)
assert.equal(source.readUInt32LE(16), 0x4e4f534a)
const jsonLength = source.readUInt32LE(12)
const original = JSON.parse(source.subarray(20, 20 + jsonLength).toString())
const document = structuredClone(original)
assert.equal(document.buffers.length, 1, 'Expected a self-contained GLB.')
assert.equal(document.buffers[0].uri, undefined)
assert.ok(!document.extensionsUsed?.includes(extension), 'Compress the original, not an already compressed asset.')
const binHeader = 20 + jsonLength
assert.equal(source.readUInt32LE(binHeader + 4), 0x004e4942)
const binary = source.subarray(binHeader + 8, binHeader + 8 + source.readUInt32LE(binHeader))
const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }
const componentBytes = { 5121: 1, 5123: 2, 5125: 4, 5126: 4 }
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready])
const chunks = []
let binaryLength = 0
let fallbackLength = 0
let compressedViews = 0

function append(data) {
  const padding = (4 - binaryLength % 4) % 4
  chunks.push(Buffer.alloc(padding))
  binaryLength += padding
  const offset = binaryLength
  chunks.push(Buffer.from(data))
  binaryLength += data.length
  return offset
}

for (const [index, view] of document.bufferViews.entries()) {
  assert.equal(view.buffer, 0)
  const raw = binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength)
  assert.equal(raw.length, view.byteLength)
  if (!view.target) {
    // Embedded images remain byte-for-byte identical.
    view.byteOffset = append(raw)
    continue
  }
  const accessors = document.accessors.filter(accessor => accessor.bufferView === index)
  assert.equal(accessors.length, 1, 'Expected one tightly packed accessor per geometry view.')
  const accessor = accessors[0]
  assert.equal(accessor.byteOffset ?? 0, 0)
  assert.equal(accessor.sparse, undefined)
  const stride = components[accessor.type] * componentBytes[accessor.componentType]
  assert.ok(Number.isInteger(stride) && stride > 0)
  assert.equal(view.byteStride ?? stride, stride)
  assert.equal(stride * accessor.count, raw.length)
  assert.ok(view.target === 34962 || view.target === 34963)
  // INDICES keeps even the index order exact; TRIANGLES may rotate triangle indices.
  const mode = view.target === 34963 ? 'INDICES' : 'ATTRIBUTES'
  const encoded = MeshoptEncoder.encodeGltfBuffer(raw, accessor.count, stride, mode)
  const decoded = new Uint8Array(raw.length)
  MeshoptDecoder.decodeGltfBuffer(decoded, accessor.count, stride, encoded, mode)
  assert.deepEqual(Buffer.from(decoded), raw, 'Compression must decode to the exact original bytes.')
  const offset = append(encoded)
  fallbackLength = Math.ceil(fallbackLength / 4) * 4
  view.buffer = 1
  view.byteOffset = fallbackLength
  fallbackLength += raw.length
  view.extensions = {
    ...view.extensions,
    [extension]: { buffer: 0, byteOffset: offset, byteLength: encoded.length, byteStride: stride, count: accessor.count, mode },
  }
  compressedViews += 1
}

document.buffers = [
  { byteLength: binaryLength },
  { byteLength: fallbackLength, extensions: { [extension]: { fallback: true } } },
]
document.extensionsUsed = [...(document.extensionsUsed ?? []), extension]
document.extensionsRequired = [...(document.extensionsRequired ?? []), extension]
for (const key of ['nodes', 'meshes', 'accessors', 'materials', 'textures', 'images', 'samplers', 'scenes', 'animations']) {
  assert.deepEqual(document[key], original[key], key + ' must remain unchanged.')
}
const json = Buffer.from(JSON.stringify(document))
const jsonPadding = (4 - json.length % 4) % 4
const bin = Buffer.concat(chunks)
const binPadding = (4 - bin.length % 4) % 4
const header = Buffer.alloc(20)
header.writeUInt32LE(0x46546c67, 0)
header.writeUInt32LE(2, 4)
header.writeUInt32LE(28 + json.length + jsonPadding + bin.length + binPadding, 8)
header.writeUInt32LE(json.length + jsonPadding, 12)
header.writeUInt32LE(0x4e4f534a, 16)
const binaryHeader = Buffer.alloc(8)
binaryHeader.writeUInt32LE(bin.length + binPadding, 0)
binaryHeader.writeUInt32LE(0x004e4942, 4)
const output = Buffer.concat([header, json, Buffer.alloc(jsonPadding, 0x20), binaryHeader, bin, Buffer.alloc(binPadding)])
assert.ok(output.length < source.length)
await writeFile(outputURL, output)
assert.deepEqual(await readFile(sourceURL), source, 'Never modify the original GLB.')
const report = {
  source: 'public/models/macbook_web_ready.glb',
  output: 'public/models/macbook_web_optimized.glb',
  sourceBytes: source.length, outputBytes: output.length,
  reductionPercent: Number(((1 - output.length / source.length) * 100).toFixed(2)),
  sourceSHA256: createHash('sha256').update(source).digest('hex'),
  outputSHA256: createHash('sha256').update(output).digest('hex'),
  extension, compressedViews,
  geometryByteEquality: true, embeddedImageByteEquality: true,
  hierarchyMaterialsUVAndAccessorsPreserved: true,
  quantization: false, simplification: false,
}
await writeFile(reportURL, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
