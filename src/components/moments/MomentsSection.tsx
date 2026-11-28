import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { MOMENT_VOICE, type DemoId } from '../../data/chaerin-demo.ts'
import CallIcon from '../hero/CallIcon.tsx'
import { demoPoster, demoStill, useDemoClips } from '../demo/useDemoClips.ts'
import { useMomentFrame, useMomentScene } from './useMomentScene.ts'
import './MomentsSection.css'

const VOICE_CLIPS: readonly DemoId[] = ['long_time'], IDLE_ONLY: readonly DemoId[] = []
const wallpapers = import.meta.glob<string>('../../assets/moments/wallpapers/*.webp', { eager: true, query: '?url', import: 'default' })
type Clock = Omit<ReturnType<typeof useMomentScene>, 'frame' | 'elapsed'>
type Media = ReturnType<typeof useDemoClips>
const clamp = (n: number) => Math.max(0, Math.min(1, n))
function typed(text: string, progress: number) { return Array.from(text).slice(0, Math.floor(Array.from(text).length * clamp(progress))).join('') }

function SceneControl({ clock, name }: { clock: Clock; name: string }) {
  return !clock.reduced && <button className="moment-control" type="button" aria-label={`${name} 장면 ${clock.paused ? '재생' : '일시정지'}`} onClick={clock.toggle}><CallIcon name={clock.paused ? 'play' : 'pause'} /></button>
}
function VideoLayers({ media, still, reduced }: { media: Media; still?: string; reduced: boolean }) {
  return <>
    {media.poster && <img className="moment-poster" src={media.poster} alt="" />}
    {!reduced && [0, 1].map(index => <video key={index} className="moment-video" ref={element => { media.videos.current[index] = element }} src={media.slots[index]?.blob} data-front={media.front === index} data-clip={media.slots[index]?.clip} muted playsInline preload="auto" loop={media.slots[index]?.clip === 'idle'} onLoadedData={() => media.prepare(index)} onSeeked={() => media.prepare(index)} onTimeUpdate={() => media.onTimeUpdate(index)} onError={media.onError} />)}
    {still && <img className="moment-still" src={still} alt="" data-visible={reduced || media.fallback} />}
  </>
}
function VoiceScene() {
  const { frame: frameRef, elapsed: elapsedRef, ...clock } = useMomentScene(9600, 5500)
  const { frame: cameraRef, view: frameView } = useMomentFrame(), t = clock.time
  const speaking = t >= 2850 && t < 7100, listening = clock.reduced || t >= 900 && t < 2500
  const target = speaking ? MOMENT_VOICE.clip : 'idle'
  const time = useCallback(() => Math.max(0, elapsedRef.current - 2850), [elapsedRef])
  const media = useDemoClips({ near: clock.near, inView: clock.visible, active: clock.active, reduced: clock.reduced, frameView: frameView, target, time, preload: VOICE_CLIPS })
  const text = clock.reduced ? MOMENT_VOICE.dialogue : typed(MOMENT_VOICE.dialogue, (t - 3150) / MOMENT_VOICE.talkMs)
  const still = media.view ? demoStill(media.view, 'long_time', clock.reduced || t >= 4410) : undefined
  const phase = t < 900 ? 'idle' : t < 2500 ? 'listening' : t < 2850 ? 'self' : t < 7100 ? 'reply' : 'idle'
  return <div className="moment-scene" role="group" aria-describedby="moment-voice-description" data-scene="voice" data-phase={phase} data-time={Math.round(t)} data-active={clock.active} data-reduced={clock.reduced} data-view={media.view}>
    <p className="sr-only" id="moment-voice-description">마이크로 말을 건네자 채린이 입 모양과 표정으로 대답하는 통화 예시예요.</p>
    <div className="moment-voice" ref={frameRef} aria-hidden="true" data-listening={listening}>
      <div className="moment-call" ref={cameraRef}><VideoLayers media={media} still={still} reduced={clock.reduced} /></div>
      <div className="moment-call__top"><span className="moment-pill"><i />채린 · 연결 중</span><span className="moment-pill">AI 캐릭터</span></div>
      <div className="moment-voice__captions">{(clock.reduced || t >= 2500 && t < 7100) && <p className="moment-caption moment-caption--self">{MOMENT_VOICE.self}</p>}{(clock.reduced || speaking && t >= 3150) && <p className="moment-caption"><span>채린</span>{text || '…'}</p>}</div>
      <div className="moment-voice__mic">{listening && <div className="moment-wave">{[0, 1, 2, 3, 4, 5, 6].map(n => <i key={n} style={{ '--bar': n } as CSSProperties} />)}</div>}<span><CallIcon name="mic" />누르고 말하기</span></div>
    </div><SceneControl clock={clock} name="목소리" />
  </div>
}
function Chair() { return <svg width="88" height="88" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="13" y="6" width="22" height="22" rx="5" /><path d="M9 25v8h30v-8M14 33v10m20-10v10" /></svg> }
function PresenceScene() {
  const { frame: frameRef, ...clock } = useMomentScene(9600, 5500)
  const { frame: cameraRef, view: frameView } = useMomentFrame(), t = clock.time
  const away = t >= 1600 && t < 4200, returned = t >= 4500 && t < 7800
  const opacity = t < 7800 ? clamp((t - 4500) / 300) : 1 - clamp((t - 7800) / 300)
  // Always the wide (head→chest) render: the tall one fades out below the shoulders for
  // phone text overlays, which looks like a cut-off body in this narrow panel.
  const view = frameView ? 'wide' as const : null
  return <div className="moment-scene" role="group" aria-describedby="moment-presence-description" data-scene="presence" data-phase={away ? 'away' : returned ? 'returned' : 'present'} data-time={Math.round(t)} data-active={clock.active} data-reduced={clock.reduced}>
    <p className="sr-only" id="moment-presence-description">내 캠의 사람이 자리를 비웠다가 돌아오자 채린이 알아채고 말을 거는 예시예요.</p>
    <div className="moment-presence" ref={frameRef} aria-hidden="true">
      <div className="moment-presence__mate" ref={cameraRef}>{clock.near && view && <><img src={demoPoster(view)} alt="" /><img src={demoStill(view, 'silence', false)} alt="" style={{ opacity }} /></>}<span className="moment-pill">AI 캐릭터</span>{returned && <p className="moment-caption">…어디 갔다 왔어?</p>}</div>
      <div className="moment-presence__self" data-away={away}><span className="moment-presence__label">내 캠</span><div className="moment-presence__avatar">{away ? <Chair /> : <CallIcon name="person" />}</div><p><i />{away ? `자리 비움 00:${String(42 + Math.floor((t - 1600) / 1000)).padStart(2, '0')}` : '자리에 있음'}</p><small>카메라 예시 화면</small></div>
    </div><SceneControl clock={clock} name="자리 인식" />
  </div>
}
function wallpaperForHour(hour: number) { return hour >= 5 && hour < 7 ? 'dawn' : hour >= 7 && hour < 11 ? 'morning' : hour >= 11 && hour < 17 ? 'day' : hour >= 17 && hour < 19 ? 'sunset' : 'night' }
function useDesktopTime() {
  // null until mounted: the prerendered page cannot know the visitor's clock (the wallpaper only loads once near).
  const [date, setDate] = useState<Date | null>(null)
  useEffect(() => {
    let timer = 0
    const tick = () => { setDate(new Date()); timer = window.setTimeout(tick, 60_000 - Date.now() % 60_000 + 20) }
    tick()
    return () => clearTimeout(timer)
  }, [])
  return { wallpaper: wallpaperForHour(date?.getHours() ?? 21), clock: date ? new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date) : '' }
}
// Front_Web desktop window enter easing: cubic-bezier(.22,1,.36,1).
function desktopEase(progress: number) {
  const x = clamp(progress); let low = 0, high = 1
  for (let i = 0; i < 14; i++) { const t = (low + high) / 2, sample = 3 * (1 - t) ** 2 * t * .22 + 3 * (1 - t) * t ** 2 * .36 + t ** 3; if (sample < x) low = t; else high = t }
  return 1 - (1 - (low + high) / 2) ** 3
}
function FileIcon({ kind }: { kind: 'PDF' | 'FIG' }) { return <svg width="32" height="38" viewBox="0 0 32 38" fill="none"><path d="M6 2h14l8 8v24a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" fill="var(--color-surface)" /><path d="M20 2v8h8" fill="var(--color-control)" /><text x="16" y="27" textAnchor="middle" fill="var(--color-text-accent)" fontSize="8" fontWeight="700">{kind}</text></svg> }
function DesktopScene() {
  const { frame: frameRef, ...clock } = useMomentScene(9600, 5000)
  const { frame: cameraRef, view: frameView } = useMomentFrame(), call = useRef<HTMLDivElement>(null), desktop = useDesktopTime(), t = clock.time
  const [geometry, setGeometry] = useState({ x: 0, y: 0, scale: .5 })
  const time = useCallback(() => 0, [])
  const media = useDemoClips({ near: clock.near, inView: clock.visible, active: clock.active, reduced: clock.reduced, frameView: frameView, target: 'idle', time, preload: IDLE_ONLY })
  useEffect(() => {
    const canvas = frameRef.current, window = call.current
    if (!canvas || !window) return
    const measure = () => { const w = canvas.clientWidth, h = canvas.clientHeight, scale = matchMedia('(max-width:767px)').matches ? .7 : .5; setGeometry({ x: w * .96 - window.offsetWidth * scale - window.offsetLeft, y: h * .96 - window.offsetHeight * scale - window.offsetTop, scale }) }
    const observer = new ResizeObserver(measure); observer.observe(canvas); observer.observe(window)
    return () => observer.disconnect()
  }, [frameRef])
  const progress = t < 2100 ? 0 : t < 2700 ? desktopEase((t - 2100) / 600) : t < 6500 ? 1 : t < 7100 ? 1 - desktopEase((t - 6500) / 600) : 0
  const phase = t >= 1500 && t < 2100 ? 'press' : t >= 2100 && t < 2700 ? 'moving' : t >= 2700 && t < 3500 ? 'working' : t >= 3500 && t < 6500 ? 'bubble' : 'large'
  return <div className="moment-scene" role="group" aria-describedby="moment-desktop-description" data-scene="desktop" data-phase={phase} data-time={Math.round(t)} data-active={clock.active} data-reduced={clock.reduced} data-wallpaper={desktop.wallpaper} data-view={media.view}>
    <p className="sr-only" id="moment-desktop-description">노트북에서 작업하는 동안 채린을 화면 구석의 작은 창으로 띄워 둔 모습</p>
    <div className="moment-desktop" ref={frameRef} aria-hidden="true">
      {clock.near && <img className="moment-desktop__wallpaper" src={wallpapers[`../../assets/moments/wallpapers/${desktop.wallpaper}.webp`]} alt="" />}
      <div className="moment-desktop__menu"><img src="/favicon.svg" alt="" /><span>{desktop.clock}</span></div>
      <div className="moment-desktop__files"><div><FileIcon kind="PDF" /><span>과제_<wbr />최종_<wbr />진짜최종.pdf</span></div><div><FileIcon kind="FIG" /><span>기획서_<wbr />v3.fig</span></div></div>
      <div className="moment-editor" data-working={t >= 2700 && t < 6500}><div className="moment-window-bar"><span>기획서_v3</span><span className="moment-window-dots"><i /><i /><i /></span></div><div className="moment-editor__page">{[0, 1, 2, 3, 4].map(n => <i key={n} />)}<i data-added={t >= 3000 && t < 7100} /><b className="moment-editor__cursor" /></div></div>
      <div className="moment-desktop__call" ref={call} style={{ transform: `translate(${geometry.x * progress}px,${geometry.y * progress}px) scale(${1 + (geometry.scale - 1) * progress})` }}>
        <div className="moment-window-bar"><span><i className="moment-connected" />채린 · 연결 중</span><span className="moment-pip-button" data-pressed={phase === 'press'}><CallIcon name="pip" /></span></div>
        <div className="moment-desktop__video" ref={cameraRef}><VideoLayers media={media} still={media.poster} reduced={clock.reduced} /><span className="moment-desktop__ai">AI 캐릭터</span><span className="moment-desktop__mic"><CallIcon name="mic" /></span></div>
      </div>
      {phase === 'bubble' && <p className="moment-desktop__bubble">나도 옆에서 내 거 할게.</p>}
    </div><SceneControl clock={clock} name="PIP" />
  </div>
}
const scenes = [
  { number: '01', title: '목소리로 대답해요', description: '누르고 말하면 채린이 목소리로 답해요. 입 모양과 표정까지.', component: VoiceScene },
  { number: '02', title: '나를 알아봐요', description: '카메라를 켜면 자리를 비웠다 돌아온 걸 알아채요.', component: PresenceScene },
  { number: '03', title: '작업 옆에 띄워 둬요', description: 'PIP로 화면 구석에 띄워 두고, 하던 일을 계속해요.', component: DesktopScene },
]
export default function MomentsSection() {
  return <section className="moments" id="moments" aria-labelledby="moments-title"><h2 id="moments-title">옆에 있는 것처럼, 반응해요</h2><p className="sr-only">채린은 AI 캐릭터예요. 카메라와 마이크를 켜지 않는 무음 예시 장면이에요.</p>{scenes.map(({ number, title, description, component: Scene }) => <article className="moment" key={number}><div className="moment__copy"><span className="moment__number">{number}</span><h3>{title}</h3><p>{description}</p>{number === '02' && <small>영상은 브라우저 안에서만 쓰고, 저장하거나 보내지 않아요. 카메라 없이도 쓸 수 있어요.</small>}</div><Scene /></article>)}</section>
}
