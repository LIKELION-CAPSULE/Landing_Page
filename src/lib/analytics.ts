// with-async-modules 빌드: 세션 녹화기(rrweb)는 번들에 넣지 않고 녹화가 시작될 때 Mixpanel CDN 에서 받는다.
// ⚠️ dist 파일을 직접 가리킨다. src/loaders/ 쪽은 녹화기 파일명 플레이스홀더가 치환되지 않아 404 가 난다.
import mixpanel from 'mixpanel-browser/dist/mixpanel-with-async-modules.cjs.js'

// Mixpanel 프로젝트 토큰(공개용). 비어 있으면 모든 호출이 no-op 이라 로컬 개발·빌드에 토큰이 필요 없다.
const TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN as string | undefined

export function initAnalytics() {
  if (!TOKEN) return
  mixpanel.init(TOKEN, {
    // pushState 라우터(useRoute)라 경로가 바뀔 때마다 SDK 가 $mp_web_page_view 를 보낸다.
    // 수동 landing_view 는 보내지 않는다 — 같은 방문이 두 번 집계된다.
    track_pageview: 'url-with-path',
    // 클릭 자동 수집을 끈다. 아래 track() 으로 보내는 CTA 이벤트와 중복된다.
    autocapture: false,
    persistence: 'localStorage',
    // 세션 녹화. 출시 전 트래픽이 적어 전부 녹화한다 (무료 플랜 월 1만 건).
    // 입력창은 기본값(record_mask_inputs)대로 가려져 이메일은 녹화에 남지 않는다.
    // 포스터를 보여야 투표 화면이 읽히므로 이미지 차단은 풀고 영상·오디오만 막는다.
    record_sessions_percent: 100,
    record_block_selector: 'video, audio',
    ...(import.meta.env.VITE_MIXPANEL_API_HOST ? { api_host: import.meta.env.VITE_MIXPANEL_API_HOST as string } : {}),
  })
}

export type EventName =
  | 'cta_clicked'
  | 'artwork_vote_submitted'
  | 'presign_cta_clicked'
  | 'presign_completed'
  | 'presign_duplicate'
  | 'landing_api_failed'

// ⚠️ 이메일·자유 서술 등 직접 식별 정보는 속성에 넣지 않는다 (docs/data-collection.md).
export function track(event: EventName, props?: Record<string, string | number | boolean | null>) {
  if (!TOKEN) return
  mixpanel.track(event, props)
}

// 투표·사전예약 행에 같이 저장하는 방문자 ID. Mixpanel 의 익명 distinct_id 를 그대로 써서
// 분석 이벤트와 DB 행을 같은 키로 이을 수 있다. 토큰이 없으면 localStorage 의 UUID 로 대신한다.
export function visitorId(): string {
  if (TOKEN) return String(mixpanel.get_distinct_id())
  const key = 'capsule_visitor_id'
  try {
    const stored = localStorage.getItem(key)
    if (stored) return stored
    const fresh = crypto.randomUUID()
    localStorage.setItem(key, fresh)
    return fresh
  } catch {
    return crypto.randomUUID()
  }
}
