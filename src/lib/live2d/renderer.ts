// Aliving2D v2 renderer, trimmed from Front_Web src/features/mate-render/AlivingRenderer.ts + script-loader.ts
// (2026-11-28) to what the landing hero needs: load the engine/player scripts from the asset storage, create the
// player on a transparent canvas (DPR ≤ 2), pause while hidden, gaze, destroy. The engine itself is never bundled.
import type { AlivingView } from './view.ts'
import type { LiveModel } from './source.ts'

interface PlayerLike {
  model: { background: [number, number, number, number]; draw(): void }
  running: boolean
  raf: number
  last: number
  frame(now: number): void
  setExpression(name: string): boolean
  talk(ms: number): boolean
  lookAt(x: number, y: number): void
  setView(zoom: number, cx: number, cy: number): void
  destroy(): void
}
interface PlayerGlobal {
  create(canvas: HTMLCanvasElement, modelUrl: string, options?: { reactions?: string; zoom?: number; cx?: number; cy?: number; idle?: boolean }): Promise<PlayerLike>
}

const SCRIPT_TIMEOUT_MS = 15_000
const MAX_CANVAS_PIXELS = 5_500_000
const scripts = new Map<string, Promise<void>>()

function loadScript(url: string): Promise<void> {
  const existing = scripts.get(url)
  if (existing) return existing
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    const timer = window.setTimeout(() => fail(), SCRIPT_TIMEOUT_MS)
    function fail() {
      window.clearTimeout(timer)
      script.remove()
      scripts.delete(url)
      reject(new Error(`script ${url}`))
    }
    script.src = url
    script.async = false
    script.onload = () => { window.clearTimeout(timer); resolve() }
    script.onerror = fail
    document.head.append(script)
  })
  scripts.set(url, promise)
  return promise
}

export type RenderStatus = 'loading' | 'ready' | 'error'

export class LiveMateRenderer {
  private readonly model: LiveModel
  private view: AlivingView
  private readonly listeners = new Set<() => void>()
  private status: RenderStatus = 'loading'
  private host: HTMLElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private player: PlayerLike | null = null
  private observer: ResizeObserver | null = null
  private paused = false
  private destroyed = false

  constructor(model: LiveModel, view: AlivingView) {
    this.model = model
    this.view = view
  }

  getStatus() { return this.status }
  subscribe(listener: () => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  private setStatus(next: RenderStatus) {
    if (this.status === next) return
    this.status = next
    this.listeners.forEach(listener => listener())
  }

  attach(host: HTMLElement) {
    if (this.destroyed || this.host) return
    this.host = host
    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    canvas.style.cssText = 'display:block;width:100%;height:100%;background:transparent'
    this.canvas = canvas
    host.append(canvas)
    this.syncSize()
    this.observer = new ResizeObserver(() => this.syncSize())
    this.observer.observe(host)
    document.addEventListener('visibilitychange', this.applyPause)
    void this.boot(canvas)
  }

  private syncSize() {
    const { host, canvas } = this
    if (!host || !canvas) return
    // DPR ≤ 2 (as in the app), and at most ~5.5 M canvas pixels: a full-width close-up on a large retina
    // screen would otherwise redraw 7–8 M pixels every frame.
    const cssW = Math.max(1, host.clientWidth), cssH = Math.max(1, host.clientHeight)
    const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(MAX_CANVAS_PIXELS / (cssW * cssH)))
    const width = Math.max(1, Math.round(cssW * dpr))
    const height = Math.max(1, Math.round(cssH * dpr))
    if (canvas.width !== width) canvas.width = width
    if (canvas.height !== height) canvas.height = height
    this.player?.setView(this.view.zoom, this.view.cx, this.view.cy)
  }

  private async boot(canvas: HTMLCanvasElement) {
    try {
      await loadScript(this.model.engineUrl)
      if (this.destroyed) return
      await loadScript(this.model.playerUrl)
      if (this.destroyed) return
      const api = (window as unknown as { CapsuleV2Player?: PlayerGlobal }).CapsuleV2Player
      if (!api) throw new Error('CapsuleV2Player missing')
      this.syncSize()
      const player = await api.create(canvas, this.model.modelUrl, {
        reactions: this.model.reactionsUrl, idle: false, zoom: this.view.zoom, cx: this.view.cx, cy: this.view.cy,
      })
      if (this.destroyed) { player.running = false; player.destroy(); return }
      player.model.background = [0, 0, 0, 0]
      player.setView(this.view.zoom, this.view.cx, this.view.cy)
      this.player = player
      // The player starts its own loop; take it over so hidden tabs and off-screen heroes stop drawing.
      if (player.running) { player.running = false; cancelAnimationFrame(player.raf) }
      this.setStatus('ready')
      this.applyPause()
    } catch {
      if (!this.destroyed) this.setStatus('error')
    }
  }

  private applyPause = () => {
    const player = this.player
    if (!player || this.destroyed) return
    const pause = this.paused || document.hidden
    if (pause) {
      if (player.running) { player.running = false; cancelAnimationFrame(player.raf) }
      return
    }
    if (player.running) return
    player.running = true
    player.last = performance.now()
    const tick = () => {
      if (!player.running || this.destroyed) return
      try { player.frame(performance.now()) } catch {
        player.running = false
        this.setStatus('error')
        return
      }
      player.raf = requestAnimationFrame(tick)
    }
    player.raf = requestAnimationFrame(tick)
  }

  setPaused(paused: boolean) { this.paused = paused; this.applyPause() }
  setView(view: AlivingView) { this.view = view; this.player?.setView(view.zoom, view.cx, view.cy) }
  lookAt(x: number, y: number) { try { this.player?.lookAt(x, y) } catch { /* Gaze is decoration. */ } }
  /** Moves the mouth for `ms` (the line on screen is the mate's first line). */
  talk(ms: number) { try { if (ms > 0) this.player?.talk(ms) } catch { /* Decoration. */ } }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    document.removeEventListener('visibilitychange', this.applyPause)
    this.observer?.disconnect()
    const player = this.player
    this.player = null
    if (player) {
      player.running = false
      cancelAnimationFrame(player.raf)
      try { player.destroy() } catch { /* Already torn down. */ }
    }
    try { this.canvas?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext() } catch { /* Lost already. */ }
    this.canvas?.remove()
    this.canvas = null
    this.host = null
    this.listeners.clear()
  }
}
