import CallCta from '../components/hero/CallCta.tsx'
import NotFoundScene from '../components/not-found/NotFoundScene.tsx'
import { useCtaState } from '../hooks/useCtaState.ts'
import { realtimeAllowed } from '../lib/realtime.ts'
import logo from '../assets/brand/capsule-horizontal-color.svg'
import still1x from '../assets/not-found/broken-capsule.webp'
import still2x from '../assets/not-found/broken-capsule@2x.webp'
import './NotFoundPage.css'

// Served as dist/404.html (scripts/prerender.mjs) for any address that does not exist, with a 404 status.
// Still image generation (scripts/build-404-still.mjs): /nope?nf-still on the development server only.
const CAPTURE = import.meta.env.DEV && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('nf-still')

// The scene's still image (scripts/build-404-still.mjs): in the prerendered HTML, shown until the 3D takes over.
const STILL = { src: still1x, srcSet: `${still1x} 1760w, ${still2x} 3520w` }

export default function NotFoundPage() {
  const cta = useCtaState()
  if (CAPTURE) return <NotFoundScene canAnimate={realtimeAllowed} capture />
  return (
    <main className="not-found">
      <a className="not-found__brand" href="/" aria-label="캡슐 CAPSULE 홈"><img src={logo} width="1992" height="456" alt="" draggable={false} /></a>
      <NotFoundScene canAnimate={realtimeAllowed} still={STILL} />
      <div className="not-found__copy">
        <p className="sr-only">404 오류</p>
        <h1>이 페이지를 찾을 수 없어요</h1>
        <p>주소가 바뀌었거나 사라진 페이지예요. 주소를 다시 확인하거나 홈에서 시작해 주세요.</p>
        <div className="not-found__actions">
          <a className="not-found__home" href="/">홈으로</a>
          <CallCta placement="not_found" state={cta} openLabel="CAPSULE 시작하기" />
        </div>
      </div>
    </main>
  )
}
