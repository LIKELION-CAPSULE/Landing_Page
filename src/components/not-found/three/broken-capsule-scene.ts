import {
  BufferAttribute, BufferGeometry, CircleGeometry, Color, DoubleSide, FrontSide, Group, InstancedBufferAttribute,
  InstancedMesh, LineLoop, Matrix4, Mesh, NoToneMapping, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial,
  Shape, ShapeGeometry, SRGBColorSpace, Vector2, Vector3, WebGLRenderer,
} from 'three'
import type { Material, Side, Texture } from 'three'
import {
  BRAND_CAPSULE_COLORS, CAPSULE_SEAM_X, capsuleGeometry, capsuleRadiusAt, coreMaterial, forAlphaCanvas,
  haloMaterial, radialGlowTexture, shellMaterial,
} from './capsule-model.ts'

/**
 * The 404 scene: the service's capsule (capsule-model.ts, the same model and glass as 내 메이트 and the invite dome)
 * broken at its seam. Its two halves float a little apart with the violet core light pouring out of the gap; their cut
 * rims are jagged where pieces of the shell broke off, and those thin curved pieces of shell drift around it. All
 * additive light on a transparent canvas (no tone mapping, sRGB, like the invite dome), so the page's own 「4」 digits
 * and background show through. Units: the view is 8.8 wide (the scene box is 2.2 : 1), the capsule 3.05 long.
 */

export type BrokenCapsuleSceneOptions = {
  host: HTMLElement
  /** Element whose pointer tilts the scene (the page). */
  pointerTarget: HTMLElement
  /** Render one still frame at `CAPTURE_TIME` and keep it (still image generation). */
  still?: boolean
  onFirstFrame?: () => void
  onContextFailure?: () => void
}

export type BrokenCapsuleScene = {
  /** On screen and the tab visible: the loop may run. */
  setRunning(running: boolean): void
  /** The canvas (the still image script reads it). */
  canvas: HTMLCanvasElement
  dispose(): void
}

/** The moment the still image shows; the live scene starts from it, so the hand-over does not jump. */
export const CAPTURE_TIME = 1.6
/** The scene box (where the 「4 · 4」 digits are) is 8.8 × 4 units. */
const BOX = { width: 8.8, height: 4 } as const
/**
 * The canvas is a wider stage around that box, so pieces can fly out past the digits: twice the box's width (centred)
 * and 35 % of its height more above it (never below: the heading is there). not-found.css places the canvas and the
 * still image on exactly this rectangle.
 */
export const STAGE = { widthScale: 2, above: 0.35 } as const
/** Camera distance that fits the box's height in a 22° field (as before the stage grew). */
const DISTANCE = BOX.height / 2 / Math.tan((11 * Math.PI) / 180)
const MAX_DPR = 2
/** At most this many canvas pixels (a full-width retina 404 would otherwise draw ~5 M every frame). */
const MAX_PIXELS = 4_200_000
const TILT = (5 * Math.PI) / 180
const LENGTH = 3.05
/** How far apart the two halves float (scene units along the axis). */
const GAP = 0.62
const RADIAL = 96
const GLOW = new Color(BRAND_CAPSULE_COLORS.glow)
const RADIUS = capsuleRadiusAt(CAPSULE_SEAM_X)

/** Small deterministic random numbers (the same break on every visit and in the still image). */
function seeded(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

/**
 * A broken rim: how far (unit-length axis) the shell is missing at each angle around it. Mostly a fine irregular
 * crack, with a few deeper bites where a piece broke off.
 */
function brokenRim(random: () => number, bites: number) {
  // A zigzag crack: alternating short and long teeth, then a few deep bites where pieces came away.
  const count = 18
  const points = Array.from({ length: count }, (_, index) => (index % 2 ? 0.004 : 0.016) + random() * 0.014)
  for (let bite = 0; bite < bites; bite++) {
    const at = Math.floor(random() * count)
    const depth = 0.06 + random() * 0.05
    points[at] = depth
    points[(at + 1) % count] = Math.max(points[(at + 1) % count]!, depth * (0.45 + random() * 0.3))
  }
  return (angle: number) => {
    const t = ((((angle / (Math.PI * 2)) % 1) + 1) % 1) * count
    const index = Math.floor(t)
    const a = points[index % count]!, b = points[(index + 1) % count]!
    return a + (b - a) * (t - index)
  }
}

/** The half [fromX, toX] of the canonical capsule with its seam-side rim broken (`missing(angle)` cut back). */
function brokenHalfGeometry(fromX: number, toX: number, light: Color, tint: Color, missing: (angle: number) => number) {
  const geometry = capsuleGeometry(fromX, toX, light, tint, RADIAL)
  const position = geometry.getAttribute('position') as BufferAttribute
  const seamSide = fromX === CAPSULE_SEAM_X ? 1 : -1
  for (let index = 0; index < position.count; index++) {
    const x = position.getX(index)
    // The ring at the seam and the one just inside it (CAPSULE_SEAM_X ± 0.004) move back together.
    if (Math.abs(x - CAPSULE_SEAM_X) > 0.0045) continue
    const angle = Math.atan2(position.getZ(index), position.getY(index))
    const cut = missing(angle) * (Math.abs(x - CAPSULE_SEAM_X) < 1e-6 ? 1 : 0.35)
    position.setX(index, x + seamSide * cut)
  }
  geometry.computeVertexNormals()
  return geometry
}

/** Shell thickness of a piece (unit-length units, ≈ 0.05 scene units). */
const PIECE_THICKNESS = 0.016

/**
 * A piece of the shell that broke off: a patch of the capsule's cylinder with an irregular broken outline, with real
 * thickness — the outer face (on the capsule's radius), the inner face (one shell thickness in) and the broken side
 * wall between them. Built in (angle, axis) space and wrapped onto the cylinder (unit-length units).
 */
function shellPieceGeometry(random: () => number, span: number, height: number) {
  const corners = 7 + Math.floor(random() * 3)
  const outline: Vector2[] = []
  for (let corner = 0; corner < corners; corner++) {
    const angle = (corner / corners) * Math.PI * 2 + (random() - 0.5) * 0.5
    const reach = 0.62 + random() * 0.38
    outline.push(new Vector2((Math.cos(angle) * reach * span) / 2, (Math.sin(angle) * reach * height) / 2))
  }
  const wrap = (u: number, v: number, radius: number) => new Vector3(v, Math.cos(u) * radius, Math.sin(u) * radius)
  // Subdivided so the faces follow the cylinder (the outline alone triangulates into long flat slivers).
  const flat = new ShapeGeometry(new Shape(outline), 1)
  const face = (radius: number) => {
    const geometry = subdivide(flat, 3)
    const position = geometry.getAttribute('position') as BufferAttribute
    // The cylinder's own normals (radial), so the face shades smoothly; per-triangle normals of the subdivided,
    // unindexed grid would show its triangles as a faceted pattern.
    const normals = new Float32Array(position.count * 3)
    for (let index = 0; index < position.count; index++) {
      const u = position.getX(index)
      const point = wrap(u, position.getY(index), radius)
      position.setXYZ(index, point.x, point.y, point.z)
      normals.set([0, Math.cos(u), Math.sin(u)], index * 3)
    }
    geometry.setAttribute('normal', new BufferAttribute(normals, 3))
    return geometry
  }
  const outer = face(RADIUS)
  const inner = face(RADIUS - PIECE_THICKNESS)
  flat.dispose()
  // The broken side: a quad per outline edge between the outer and inner faces.
  const side: number[] = []
  outline.forEach((point, index) => {
    const next = outline[(index + 1) % outline.length]!
    const a = wrap(point.x, point.y, RADIUS), b = wrap(next.x, next.y, RADIUS)
    const c = wrap(next.x, next.y, RADIUS - PIECE_THICKNESS), d = wrap(point.x, point.y, RADIUS - PIECE_THICKNESS)
    side.push(...a.toArray(), ...b.toArray(), ...c.toArray(), ...a.toArray(), ...c.toArray(), ...d.toArray())
  })
  const wall = new BufferGeometry()
  wall.setAttribute('position', new BufferAttribute(new Float32Array(side), 3))
  wall.computeVertexNormals()
  const edge = new BufferGeometry().setFromPoints(outline.map(point => wrap(point.x, point.y, RADIUS)))
  return { outer, inner, wall, edge }
}

/** Splits every triangle into four, `levels` times (fine enough to follow the cylinder; no overlaps). */
function subdivide(flat: ShapeGeometry, levels: number) {
  const source = flat.getAttribute('position') as BufferAttribute
  const index = flat.getIndex()
  const order = index ? Array.from(index.array) : Array.from({ length: source.count }, (_, i) => i)
  let triangles: [number, number][][] = []
  for (let i = 0; i < order.length; i += 3) {
    triangles.push([order[i]!, order[i + 1]!, order[i + 2]!].map(v => [source.getX(v), source.getY(v)] as [number, number]))
  }
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  for (let level = 0; level < levels; level++) {
    triangles = triangles.flatMap(([a, b, c]) => {
      const ab = mid(a!, b!), bc = mid(b!, c!), ca = mid(c!, a!)
      return [[a!, ab, ca], [ab, b!, bc], [ca, bc, c!], [ab, bc, ca]]
    })
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(triangles.flatMap(triangle => triangle.flatMap(([x, y]) => [x, y, 0]))), 3))
  return geometry
}

/** Light quads (core / halo) of the canonical capsule, centred on a group (camera-facing in their shaders). */
function lightQuad(material: ShaderMaterial, size: number, weight: number) {
  const mesh = new InstancedMesh(new PlaneGeometry(1, 1), material, 1)
  mesh.setMatrixAt(0, new Matrix4().makeScale(size, size, size))
  mesh.geometry.setAttribute('instanceGlow', new InstancedBufferAttribute(new Float32Array([1]), 1))
  mesh.geometry.setAttribute('instanceWeight', new InstancedBufferAttribute(new Float32Array([weight]), 1))
  mesh.geometry.setAttribute('instanceGlowColor', new InstancedBufferAttribute(new Float32Array([GLOW.r, GLOW.g, GLOW.b]), 3))
  mesh.frustumCulled = false
  return mesh
}

/**
 * Plain additive light (glow cards, the pieces' broken sides and edges) for the transparent canvas: like
 * capsule-model.ts's materials with `forAlphaCanvas`, the colour is premultiplied and the alpha is its brightest
 * channel. (A MeshBasicMaterial would write colour brighter than its alpha, an invalid premultiplied pixel that some
 * compositors — WebKit — show as coloured speckles.)
 */
function glowMaterial(options: { color: string; opacity?: number; map?: Texture; side?: Side }) {
  return forAlphaCanvas(new ShaderMaterial({
    defines: options.map ? { HAS_MAP: '' } : {},
    uniforms: { uColor: { value: new Color(options.color) }, uOpacity: { value: options.opacity ?? 1 }, uMap: { value: options.map ?? null } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform sampler2D uMap;
      varying vec2 vUv;
      void main() {
        float amount = uOpacity;
        #ifdef HAS_MAP
          vec4 texel = texture2D(uMap, vUv);
          amount *= texel.a * max(max(texel.r, texel.g), texel.b);
        #endif
        // Colour to the output space first, then the amount (as MeshBasicMaterial's additive blend weighs it).
        gl_FragColor = vec4(uColor, 1.0);
        #include <colorspace_fragment>
        gl_FragColor.rgb *= amount;
        gl_FragColor.a = clamp(max(max(gl_FragColor.r, gl_FragColor.g), gl_FragColor.b), 0.0, 1.0);
      }
    `,
    transparent: false,
    depthWrite: false,
    side: options.side ?? FrontSide,
  }))
}

type Piece = { group: Group; base: Vector3; rest: Vector3; sway: Vector3; phase: number; bob: number; depth: number }

/**
 * The pieces, burst outward from the gap across the whole stage (scene units; z toward the viewer): near ones larger
 * (and a little softer), far ones small and dim. size (angle span, axial share), which half they came from, light
 * (1 = as the shell) and a resting turn that shows their curve.
 */
const PIECES: readonly { at: [number, number, number]; span: number; height: number; tinted: boolean; light: number; turn: [number, number, number] }[] = [
  // Thrown out of the crack, mostly across the capsule's axis (up-left and down-right of the gap), farther the
  // later they broke: close to the gap, mid-flight, and near the viewer (large, softer; perspective already carries
  // them ~25 % farther out on screen, so they sit a little inward here).
  { at: [-0.6, 1.25, 0.9], span: 1.4, height: 0.16, tinted: false, light: 1, turn: [-0.4, -1.05, 2.6] },
  { at: [0.75, -1.1, 0.9], span: 1.3, height: 0.15, tinted: true, light: 1, turn: [0.5, 1.15, 0.35] },
  { at: [-1.75, 2.55, 0.5], span: 1.0, height: 0.12, tinted: false, light: 0.9, turn: [-2.2, -1.2, 0.9] },
  { at: [2.0, -1.3, 1.3], span: 1.05, height: 0.12, tinted: true, light: 0.9, turn: [2.3, 0.95, -0.6] },
  { at: [-2.75, 2.25, 1.9], span: 1.7, height: 0.2, tinted: false, light: 0.75, turn: [0.4, -0.6, 1.1] },
  { at: [4.6, -0.9, 2.2], span: 1.8, height: 0.21, tinted: true, light: 0.75, turn: [-1.1, 1.25, -2.2] },
  { at: [-4.7, 0.15, 0.8], span: 1.0, height: 0.12, tinted: false, light: 0.85, turn: [1.9, -0.8, 0.7] },
  { at: [4.4, 2.5, 0.4], span: 0.85, height: 0.1, tinted: true, light: 0.8, turn: [1.6, 0.9, 0.4] },
  // Far behind, small and dim.
  { at: [7.2, 2.2, -2.0], span: 0.7, height: 0.08, tinted: true, light: 0.55, turn: [1.2, 1.4, -0.4] },
  { at: [-6.8, 0.9, -2.2], span: 0.7, height: 0.08, tinted: false, light: 0.55, turn: [-0.7, -1.4, 1.9] },
]

export function createBrokenCapsuleScene(options: BrokenCapsuleSceneOptions): BrokenCapsuleScene {
  const { host, pointerTarget, still = false } = options
  let running = !still
  let disposed = false
  let contextLost = false
  let raf = 0
  let firstFrame = true

  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: still })
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = NoToneMapping
  host.appendChild(canvas)

  const scene = new Scene()
  const camera = new PerspectiveCamera(22, 2.2, 1, 80)
  const geometries: BufferGeometry[] = []
  const materials: Material[] = []
  const textures: Texture[] = []
  const keep = <T extends BufferGeometry>(geometry: T) => (geometries.push(geometry), geometry)
  const own = <T extends Material>(material: T) => (materials.push(material), material)
  const texture = (stops: readonly [number, string][]) => {
    const made = radialGlowTexture(stops)
    textures.push(made)
    return made
  }
  const random = seeded(404)

  /** Tilts with the pointer. */
  const tilt = new Group()
  scene.add(tilt)

  // ── The capsule, broken at its seam ──
  const light = new Color(BRAND_CAPSULE_COLORS.lightHalf)
  const tint = new Color(BRAND_CAPSULE_COLORS.tintHalf)
  const shellLook = (material: ShaderMaterial, seamX = CAPSULE_SEAM_X) => {
    material.uniforms.uLight!.value = light
    material.uniforms.uTint!.value = tint
    material.uniforms.uGlow!.value = 2.6
    material.uniforms.uWeight!.value = 0.95
    material.uniforms.uSeamX!.value = seamX
    return own(forAlphaCanvas(material))
  }
  const shell = shellLook(shellMaterial(false, GLOW))
  const capsule = new Group()
  // Lying like the logo's capsule: rising to the right, turned a little toward the viewer.
  capsule.rotation.set(0.32, -0.42, 0.52)
  tilt.add(capsule)

  const cutGlow = texture([[0, 'rgba(255,255,255,0.95)'], [0.35, 'rgba(255,255,255,0.55)'], [0.8, 'rgba(255,255,255,0.1)'], [1, 'rgba(255,255,255,0)']])
  function half(fromX: number, toX: number, side: -1 | 1, missing: (angle: number) => number) {
    const group = new Group()
    // Centre the half on its own group so it can turn in place.
    const offset = ((fromX + toX) / 2) * LENGTH
    const mesh = new Mesh(keep(brokenHalfGeometry(fromX, toX, light, tint, missing)), shell)
    mesh.scale.setScalar(LENGTH)
    mesh.position.x = -offset
    mesh.renderOrder = 1
    // Inside the broken rim: the core's light filling the open end (set back behind the deepest bite).
    const cut = new Mesh(keep(new CircleGeometry(RADIUS * LENGTH * 0.97, RADIAL)), own(glowMaterial({ map: cutGlow, color: '#C9B5FF', side: DoubleSide })))
    cut.rotation.y = Math.PI / 2
    cut.position.x = (CAPSULE_SEAM_X - side * 0.07) * LENGTH - offset
    cut.renderOrder = 2
    group.add(mesh, cut)
    group.userData.rest = offset + (side * GAP) / 2
    capsule.add(group)
    return group
  }
  const lowerHalf = half(-0.5, CAPSULE_SEAM_X, -1, brokenRim(random, 2))
  const upperHalf = half(CAPSULE_SEAM_X, 0.5, 1, brokenRim(random, 3))

  // The light between the halves: the canonical core and halo, a wider soft bloom, and a faint streak across the gap.
  const core = own(forAlphaCanvas(coreMaterial(GLOW)))
  core.uniforms.uBreath!.value = 0
  core.uniforms.uStrength!.value = 2.2
  const coreMesh = lightQuad(core, 1.7, 1)
  geometries.push(coreMesh.geometry)
  coreMesh.renderOrder = 3
  const halo = own(forAlphaCanvas(haloMaterial(GLOW)))
  halo.uniforms.strength!.value = 0.5
  const haloMesh = lightQuad(halo, 3.4, 1)
  geometries.push(haloMesh.geometry)
  haloMesh.renderOrder = 3
  const gapLight = new Group()
  gapLight.position.x = CAPSULE_SEAM_X * LENGTH
  gapLight.add(coreMesh, haloMesh)
  capsule.add(gapLight)
  const bloom = new Mesh(keep(new PlaneGeometry(1, 1)), own(glowMaterial({ map: texture([[0, 'rgba(255,255,255,0.5)'], [0.45, 'rgba(255,255,255,0.14)'], [1, 'rgba(255,255,255,0)']]), color: '#8E66FF' })))
  bloom.scale.set(6.2, 4.4, 1)
  bloom.position.z = -1.2
  bloom.renderOrder = 0
  tilt.add(bloom)
  const streak = new Mesh(keep(new PlaneGeometry(1, 1)), own(glowMaterial({ map: texture([[0, 'rgba(255,255,255,0.38)'], [0.25, 'rgba(255,255,255,0.1)'], [1, 'rgba(255,255,255,0)']]), color: '#D6C8FF', side: DoubleSide })))
  streak.scale.set(0.1, 2.6, 1)
  streak.rotation.y = Math.PI / 2
  streak.renderOrder = 3
  gapLight.add(streak)

  // ── Pieces of the shell that broke off: the same glass with real thickness, their broken sides catching the light ──
  // Same shell material, its colour fixed to one half (the seam moved far away: no seam band on a piece). The inner
  // face is a little dimmer, so the two faces read as one thick shell rather than two bright films.
  const pieces: Piece[] = PIECES.map(({ at, span, height, tinted, light: strength, turn }) => {
    const seam = tinted ? -10 : 10
    const outerMaterial = shellLook(shellMaterial(false, GLOW), seam)
    const innerMaterial = shellLook(shellMaterial(false, GLOW), seam)
    outerMaterial.uniforms.uStrength!.value = strength
    innerMaterial.uniforms.uStrength!.value = 0.55 * strength
    const wallMaterial = own(glowMaterial({ color: '#E2D6FF', opacity: 0.7 * strength, side: DoubleSide }))
    const pieceEdge = own(glowMaterial({ color: '#F4F0FF', opacity: 0.32 * strength }))
    const { outer, inner, wall, edge } = shellPieceGeometry(random, span, height)
    for (const geometry of [outer, inner, wall, edge]) keep(geometry)
    const body = new Group()
    // The patch lies on the unit capsule's cylinder: scale it like the capsule and centre it on its own middle.
    body.scale.setScalar(LENGTH)
    body.position.y = -(RADIUS - PIECE_THICKNESS / 2) * LENGTH
    const outerMesh = new Mesh(outer, outerMaterial)
    const innerMesh = new Mesh(inner, innerMaterial)
    const wallMesh = new Mesh(wall, wallMaterial)
    const line = new LineLoop(edge, pieceEdge)
    outerMesh.renderOrder = innerMesh.renderOrder = 4
    wallMesh.renderOrder = line.renderOrder = 5
    body.add(innerMesh, outerMesh, wallMesh, line)
    const group = new Group()
    group.add(body)
    const rest = new Vector3(...turn)
    group.rotation.setFromVector3(rest)
    group.position.set(...at)
    tilt.add(group)
    return {
      group, rest,
      base: new Vector3(...at),
      sway: new Vector3(0.18 + random() * 0.12, 0.2 + random() * 0.15, 0.12 + random() * 0.1),
      phase: random() * Math.PI * 2,
      bob: 0.04 + random() * 0.04,
      depth: at[2],
    }
  })

  // ── Motion ──
  const pointer = { x: 0, y: 0 }
  const tilted = { x: 0, y: 0 }
  /** Scene time beyond CAPTURE_TIME (accumulates only while drawing, so a pause resumes without a jump). */
  let elapsed = 0
  let lastTime = 0

  function pose(t: number) {
    const drift = Math.sin(t * 0.55)
    lowerHalf.position.x = (lowerHalf.userData.rest as number) - 0.05 * drift
    upperHalf.position.x = (upperHalf.userData.rest as number) + 0.05 * drift
    lowerHalf.position.y = 0.04 * Math.sin(t * 0.7 + 1)
    upperHalf.position.y = 0.05 * Math.sin(t * 0.62 + 2.4)
    lowerHalf.rotation.set(0.05 * Math.sin(t * 0.4), 0, -0.07 + 0.03 * Math.sin(t * 0.5))
    upperHalf.rotation.set(0.06 * Math.sin(t * 0.45 + 1), 0, 0.08 + 0.035 * Math.sin(t * 0.52 + 0.7))
    capsule.position.y = 0.06 * Math.sin(t * 0.45)
    core.uniforms.uStrength!.value = 2.2 + 0.25 * Math.sin(t * 1.1)
    for (const piece of pieces) {
      // Rocking around the resting turn (never a full spin, which would show the pieces edge-on and flat).
      piece.group.rotation.set(
        piece.rest.x + piece.sway.x * Math.sin(t * 0.37 + piece.phase),
        piece.rest.y + piece.sway.y * Math.sin(t * 0.31 + piece.phase * 1.7),
        piece.rest.z + piece.sway.z * Math.sin(t * 0.43 + piece.phase * 0.6),
      )
      // Drifting a little in and out along its way from the gap, bobbing, and following the pointer by depth.
      const out = 0.12 * Math.sin(t * 0.35 + piece.phase)
      const length = Math.hypot(piece.base.x, piece.base.y) || 1
      piece.group.position.x = piece.base.x + (piece.base.x / length) * out + tilted.y * (piece.depth + 2.6) * 0.55
      piece.group.position.y = piece.base.y + (piece.base.y / length) * out + piece.bob * Math.sin(t * 0.6 + piece.phase) - tilted.x * (piece.depth + 2.6) * 0.35
      piece.group.position.z = piece.base.z
    }
  }

  function resize() {
    const width = Math.max(1, host.clientWidth)
    const height = Math.max(1, host.clientHeight)
    const dpr = still ? Math.min(window.devicePixelRatio || 1, 2) : Math.min(window.devicePixelRatio || 1, MAX_DPR, Math.sqrt(MAX_PIXELS / (width * height)))
    renderer.setPixelRatio(dpr)
    renderer.setSize(width, height, false)
    // The camera stays where it was for the box alone (looking at the capsule); the canvas is a window onto a taller
    // symmetric frame (box top + `above` up, box bottom down), so the capsule looks the same and the stage extends up.
    const top = BOX.height / 2 + STAGE.above * BOX.height
    const fullHeight = height * (2 * top) / (top + BOX.height / 2)
    camera.fov = (2 * Math.atan(top / DISTANCE) * 180) / Math.PI
    camera.aspect = width / fullHeight
    camera.position.set(0, 0, DISTANCE)
    camera.lookAt(0, 0, 0)
    camera.setViewOffset(width, fullHeight, 0, 0, width, height)
    camera.updateProjectionMatrix()
    request()
  }

  function render(now: number) {
    if (disposed || contextLost) return
    const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 1 / 60
    lastTime = now
    if (!firstFrame) elapsed += dt
    const seconds = still ? CAPTURE_TIME : CAPTURE_TIME + elapsed
    const k = 1 - Math.exp(-6 * dt)
    tilted.x += (pointer.y * TILT - tilted.x) * k
    tilted.y += (pointer.x * TILT - tilted.y) * k
    tilt.rotation.set(tilted.x, tilted.y, 0)
    pose(seconds)
    renderer.render(scene, camera)
    if (firstFrame) {
      firstFrame = false
      options.onFirstFrame?.()
    }
  }

  function frame() {
    raf = 0
    render(performance.now())
    if (running) request()
  }
  function request() {
    if (!raf && !disposed && !contextLost && (running || firstFrame)) raf = requestAnimationFrame(frame)
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    lastTime = 0
  }

  const onPointerMove = (event: PointerEvent) => {
    pointer.x = Math.max(-1, Math.min(1, (event.clientX / window.innerWidth) * 2 - 1))
    pointer.y = Math.max(-1, Math.min(1, (event.clientY / window.innerHeight) * 2 - 1))
  }
  if (!still) pointerTarget.addEventListener('pointermove', onPointerMove, { passive: true })
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(host)
  const onContextLost = (event: Event) => {
    event.preventDefault()
    contextLost = true
    stop()
    options.onContextFailure?.()
  }
  canvas.addEventListener('webglcontextlost', onContextLost)
  pose(CAPTURE_TIME)
  renderer.compile(scene, camera)
  resize()

  return {
    canvas,
    setRunning(value) {
      if (still) return
      running = value
      if (value) request()
      else stop()
    },
    dispose() {
      disposed = true
      stop()
      resizeObserver.disconnect()
      pointerTarget.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      for (const geometry of geometries) geometry.dispose()
      for (const material of materials) material.dispose()
      for (const item of textures) item.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}
