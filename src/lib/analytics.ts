import posthog from 'posthog-js'

// PostHog 공개 프로젝트 키. 비어 있으면 모든 호출이 no-op 이라 로컬 개발·빌드에 키가 필요 없다.
const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com'

export function initAnalytics() {
  if (!KEY) return
  posthog.init(KEY, {
    api_host: HOST,
    // pushState 라우터(useRoute)라 경로 변경마다 $pageview 를 SDK 가 자동으로 보낸다.
    // 수동 landing_view 는 보내지 않는다 — 같은 방문이 두 번 집계된다.
    capture_pageview: 'history_change',
    capture_pageleave: true,
    // 클릭 자동 수집을 끈다. 아래 track() 으로 보내는 CTA 이벤트와 중복된다.
    autocapture: false,
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
  if (!KEY) return
  posthog.capture(event, props)
}

// 투표·사전예약 행에 같이 저장하는 방문자 ID. PostHog 의 익명 distinct_id 를 그대로 써서
// 분석 이벤트와 DB 행을 같은 키로 이을 수 있다. 키가 없으면 localStorage 의 UUID 로 대신한다.
export function visitorId(): string {
  if (KEY) return posthog.get_distinct_id()
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
