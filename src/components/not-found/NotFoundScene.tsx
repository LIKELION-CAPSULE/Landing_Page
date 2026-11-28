import { useEffect, useId, useRef, type CSSProperties } from 'react'
import { CAPSULE_CENTER, CAPSULE_PIECES, GLASS_SHARDS, type Point } from './shards.ts'
import './not-found.css'

// 「404」 with the 0 replaced by the CAPSULE capsule, cracked, and violet glass splinters drifting around it.
// Decoration only (aria-hidden): the page says what happened in words. React + CSS + inline SVG, no other
// imports, so the app (Front_Web) can take this folder as is (see the 404 report).

const polygon = (points: readonly Point[]) => points.map(([x, y]) => `${x},${y}`).join(' ')
const percentPolygon = (points: readonly Point[]) => `polygon(${points.map(([x, y]) => `${x}% ${y}%`).join(', ')})`

/** The logo v2 glyph's paths (capsule-glyph-color.svg, without its translate: these are the symbol's coordinates). */
function Glyph({ id }: { id: string }) {
  return <>
    <path d="M113.938 221.039L219.589 157.256L302.231 294.144L196.58 357.927A79.95 79.95 0 0 1 113.938 221.039Z" fill={`url(#${id}-left)`} />
    <path d="M219.589 157.256L288.7 115.533A79.95 79.95 0 0 1 371.342 252.421L302.231 294.144Z" fill={`url(#${id}-right)`} />
    <path d="M218.596 246.613A47.2 78.86 -26.3 1 0 303.224 204.787A47.2 78.86 -26.3 1 0 218.596 246.613Z" fill={`url(#${id}-seam)`} />
  </>
}

function BrokenCapsule() {
  const id = useId().replace(/:/g, '')
  return (
    <svg className="nf-capsule" viewBox="50 80 390 320" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-left`} x1="0" y1="0" x2="0.5" y2="1"><stop stopColor="#FFFFFF" /><stop offset="1" stopColor="#D4C3FA" /></linearGradient>
        <linearGradient id={`${id}-right`} x1="0" y1="0" x2="0.6" y2="1"><stop stopColor="#FFFFFF" /><stop offset="1" stopColor="#CAB2F9" /></linearGradient>
        <linearGradient id={`${id}-seam`} x1="0" y1="0" x2="0.6" y2="1"><stop stopColor="#B397FC" /><stop offset="1" stopColor="#8053F2" /></linearGradient>
        <clipPath id={`${id}-body`}>
          <path d="M113.938 221.039L219.589 157.256L302.231 294.144L196.58 357.927A79.95 79.95 0 0 1 113.938 221.039Z" />
          <path d="M219.589 157.256L288.7 115.533A79.95 79.95 0 0 1 371.342 252.421L302.231 294.144Z" />
        </clipPath>
        {CAPSULE_PIECES.map((piece, index) => <clipPath key={index} id={`${id}-piece-${index}`}><polygon points={polygon(piece.points)} /></clipPath>)}
      </defs>
      {CAPSULE_PIECES.map((piece, index) => (
        <g
          key={index}
          className="nf-piece"
          style={{ '--dx': `${piece.dx}px`, '--dy': `${piece.dy}px`, '--rot': `${piece.rotate}deg`, '--period': `${piece.period}s`, '--delay': `${piece.delay}s`, '--depth': piece.depth, transformOrigin: `${CAPSULE_CENTER[0]}px ${CAPSULE_CENTER[1]}px` } as CSSProperties}
        >
          <g clipPath={`url(#${id}-piece-${index})`}><Glyph id={id} /></g>
          {/* The crack: the piece's edge, only where it crosses the capsule. */}
          <g clipPath={`url(#${id}-body)`}><polygon className="nf-crack" points={polygon(piece.points)} /></g>
        </g>
      ))}
    </svg>
  )
}

export default function NotFoundScene() {
  const scene = useRef<HTMLDivElement>(null)

  // Pointer parallax (a few px) and the low-end switch. Nothing moves under reduced motion (CSS).
  useEffect(() => {
    const element = scene.current
    if (!element) return
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number }
    const lite = (nav.hardwareConcurrency ?? 8) < 4 || (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) || Boolean(nav.connection?.saveData)
    if (lite) { element.dataset.lite = ''; return }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const move = (event: PointerEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        element.style.setProperty('--mx', ((event.clientX / window.innerWidth) * 2 - 1).toFixed(3))
        element.style.setProperty('--my', ((event.clientY / window.innerHeight) * 2 - 1).toFixed(3))
      })
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => { window.removeEventListener('pointermove', move); cancelAnimationFrame(frame) }
  }, [])

  return (
    <div ref={scene} className="nf-scene" aria-hidden="true">
      <div className="nf-number"><span>4</span><BrokenCapsule /><span>4</span></div>
      {GLASS_SHARDS.map((shard, index) => (
        <div
          key={index}
          className="nf-glass"
          style={{ left: `${shard.left}%`, top: `${shard.top}%`, width: `${shard.width}%`, aspectRatio: `${1 / shard.aspect}`, '--rot': `${shard.rotate}deg`, '--period': `${shard.period}s`, '--delay': `${shard.delay}s`, '--depth': shard.depth } as CSSProperties}
        >
          <div className="nf-glass__pane" style={{ clipPath: percentPolygon(shard.points) }} />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points={polygon(shard.points)} /></svg>
        </div>
      ))}
    </div>
  )
}
