import mixpanel from 'mixpanel-browser/src/loaders/loader-module-core'

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
