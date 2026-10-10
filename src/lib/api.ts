import { track, visitorId } from './analytics.ts'

// Supabase REST(PostgREST)에 anon 키로 직접 INSERT 한다. 검증·중복 제한·읽기 차단은 DB 제약과 RLS 가
// 맡는다 (supabase/migrations/2026-10-10_landing_data.sql). 둘 다 비어 있으면 저장을 건너뛰고
// 화면 흐름만 진행한다 — 연동 전과 같은 동작.
// ponytail: supabase-js 대신 fetch 두 번. INSERT 외에 쓰는 기능이 없어 SDK(약 40 kB gzip)가 값을 못 한다.
const BASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const enabled = Boolean(BASE_URL && ANON_KEY)

type PgError = { code?: string; message: string }

// 첫 진입 때의 유입 정보. SPA 라 이후 화면에는 쿼리가 없으니 처음 한 번 잡아 세션 저장소에 둔다.
// 투표·사전예약 행에 같이 저장해서 "인스타에서 온 사람 중 몇 명이 예약했나" 를 DB 에서 바로 본다.
type Attribution = {
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  referrer: string | null   // 외부 도메인만. 같은 사이트 안 이동은 null
  landing_path: string      // 처음 연 경로
}

const ATTRIBUTION_KEY = 'capsule_attribution'

export function captureAttribution(): Attribution {
  try {
    const stored = sessionStorage.getItem(ATTRIBUTION_KEY)
    if (stored) return JSON.parse(stored) as Attribution
  } catch {
    // 세션 저장소를 못 쓰면 매번 현재 값으로
  }
  const query = new URLSearchParams(window.location.search)
  const cut = (value: string | null) => (value ? value.slice(0, 100) : null)
  let referrer: string | null = null
  try {
    const host = document.referrer ? new URL(document.referrer).hostname : ''
    referrer = host && host !== window.location.hostname ? host : null
  } catch {
    referrer = null
  }
  const attribution: Attribution = {
    utm_source: cut(query.get('utm_source')),
    utm_medium: cut(query.get('utm_medium')),
    utm_campaign: cut(query.get('utm_campaign')),
    referrer,
    landing_path: window.location.pathname.slice(0, 100),
  }
  try {
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution))
  } catch {
    // 무시
  }
  return attribution
}

// 성공이면 null, 실패면 PostgREST 오류 본문({code, message}). 네트워크 오류는 code 없이 message 만.
async function insert(table: string, row: Record<string, unknown>): Promise<PgError | null> {
  try {
    const res = await fetch(`${BASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: ANON_KEY!,
        Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal', // SELECT 정책이 없으므로 행을 돌려받지 않는다
      },
      body: JSON.stringify(row),
    })
    if (res.ok) return null
    return (await res.json().catch(() => null)) ?? { code: String(res.status), message: res.statusText }
  } catch (error) {
    return { message: error instanceof Error ? error.message : String(error) }
  }
}

export type SaveResult = 'saved' | 'duplicate' | 'failed' | 'disabled'

function failed(table: string, error: PgError): SaveResult {
  console.error(`[landing] ${table} 저장 실패`, error)
  track('landing_api_failed', { table, code: error.code ?? null })
  return 'failed'
}

// 같은 방문자가 다시 투표하면 행이 하나 더 들어간다. 집계 뷰(landing_vote_summary)가
// 방문자당 마지막 표만 센다 — anon 에 UPDATE 를 열지 않기 위해서다.
export async function saveVote(roomId: string): Promise<SaveResult> {
  if (!enabled) return 'disabled'
  const error = await insert('landing_vote', { room_id: roomId, visitor_id: visitorId(), ...captureAttribution() })
  return error ? failed('landing_vote', error) : 'saved'
}

export type PreorderInput = {
  email: string
  surveyPicks: Record<string, ReadonlySet<string>>
  surveyWish: string
  marketingConsent: boolean
  votedRoomId: string | null
}

export async function savePreorder(input: PreorderInput): Promise<SaveResult> {
  if (!enabled) return 'disabled'
  const error = await insert('landing_preorder', {
    email: input.email.trim().toLowerCase(),
    survey_picks: Object.fromEntries(
      Object.entries(input.surveyPicks).map(([group, picked]) => [group, [...picked]]),
    ),
    survey_wish: input.surveyWish.trim() || null,
    privacy_consent: true,
    marketing_consent: input.marketingConsent,
    voted_room_id: input.votedRoomId,
    visitor_id: visitorId(),
    ...captureAttribution(),
  })
  if (!error) return 'saved'
  // 23505 = unique_violation: 이미 등록된 이메일. 사용자에게는 완료로 보여주고 집계만 구분한다.
  if (error.code === '23505') return 'duplicate'
  return failed('landing_preorder', error)
}

// "현재까지 N명이 투표했어요" 의 N. 투표한 고유 방문자 수를 DB 함수(landing_vote_total)로 받는다.
// anon 은 테이블을 못 읽지만 이 함수는 숫자 하나만 돌려주므로 열어 뒀다. 실패·미설정이면 null.
//
// 마지막으로 받은 값을 기억해 둔다. 투표 페이지를 나갔다 돌아올 때마다 다시 요청하는데, 응답이
// 오기 전 첫 화면이 "N명" 으로 깜빡이지 않게 그동안 직전 숫자를 보여준다.
let lastVoteTotal: number | null = null
export function lastKnownVoteTotal(): number | null {
  return lastVoteTotal
}

export async function fetchVoteTotal(): Promise<number | null> {
  if (!enabled) return null
  try {
    const res = await fetch(`${BASE_URL}/rest/v1/rpc/landing_vote_total`, {
      method: 'POST',
      headers: { apikey: ANON_KEY!, Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' },
      body: '{}',
    })
    if (!res.ok) return null
    const total = Number(await res.json())
    if (!Number.isFinite(total)) return null
    lastVoteTotal = total
    return total
  } catch {
    return null
  }
}
