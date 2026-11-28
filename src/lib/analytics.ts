// with-async-modules 빌드: 세션 녹화기(rrweb)는 번들에 넣지 않고 녹화가 시작될 때 Mixpanel CDN 에서 받는다.
// ⚠️ dist 파일을 직접 가리킨다. src/loaders/ 쪽은 녹화기 파일명 플레이스홀더가 치환되지 않아 404 가 난다.
import mixpanel from 'mixpanel-browser/dist/mixpanel-with-async-modules.cjs.js'

// Mixpanel 프로젝트 토큰(공개용). 비어 있으면 모든 호출이 no-op 이라 로컬 개발·빌드에 토큰이 필요 없다.
const TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN as string | undefined

export function initAnalytics() {
  if (!TOKEN) return
  mixpanel.init(TOKEN, {
    // 단일 랜딩의 페이지뷰는 SDK의 $mp_web_page_view를 사용한다.
    // 수동 landing_view 는 보내지 않는다 — 같은 방문이 두 번 집계된다.
    track_pageview: 'url-with-path',
    // 클릭 자동 수집을 끈다. 아래 track() 으로 보내는 CTA 이벤트와 중복된다.
    autocapture: false,
    persistence: 'localStorage',
    // 세션 녹화. 출시 전 트래픽이 적어 전부 녹화한다 (무료 플랜 월 1만 건).
    // 입력은 SDK 기본값대로 가리고 영상·오디오를 차단한다.
    record_sessions_percent: 100,
    record_block_selector: 'video, audio',
    ...(import.meta.env.VITE_MIXPANEL_API_HOST ? { api_host: import.meta.env.VITE_MIXPANEL_API_HOST as string } : {}),
  })
}

// Source: docs/renewal-2026-11.md §5. Trigger rules and metrics: docs/data-collection.md,
// docs/frontend-schema.md §3. Update those docs when this contract changes.
export type EventProps = {
  cta_clicked: { cta: 'hero' | 'final' | 'header' | 'scroll_hint' | 'not_found'; state: 'before_open' | 'preparing' | 'open'; device: 'desktop' | 'mobile' }
  demo_chip_clicked: { chip: 'long_time' | 'ask' | 'thanks' | 'bye' }
  demo_silence_shown: Record<string, never>
  pc_link_copied: { method: 'share' | 'clipboard' }
  mate_card_viewed: { mate: 'chaerin' | 'dohyun' }
  hero_mate_selected: { mate: 'chaerin' | 'dohyun' }
}
export type EventName = keyof EventProps

// ⚠️ 이메일·자유 서술 등 직접 식별 정보는 속성에 넣지 않는다 (docs/data-collection.md).
export function track<E extends EventName>(event: E, props: EventProps[E]) {
  if (!TOKEN) return
  mixpanel.track(event, props)
}
