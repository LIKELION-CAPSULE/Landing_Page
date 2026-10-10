import { track, visitorId } from './analytics.ts'

// Supabase REST(PostgREST)에 anon 키로 직접 INSERT 한다. 검증·중복 제한·읽기 차단은 DB 제약과 RLS 가
// 맡는다 (supabase/migrations/). 연결이 없으면 disabled 를 반환한다.
// 사전예약 완료 화면은 실제 저장 성공 또는 중복 확인 응답이 있어야 열린다.
// Save through REST without an additional client SDK.
const BASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const enabled = Boolean(BASE_URL && ANON_KEY)

type PgError = { code?: string; message: string }

function requestHeaders(): Record<string, string> {
  // Publishable keys aren't JWTs; use apikey alone. Legacy anon JWTs also use Bearer.
  return {
    apikey: ANON_KEY!,
    'Content-Type': 'application/json',
    ...(ANON_KEY?.startsWith('sb_publishable_') ? {} : { Authorization: `Bearer ${ANON_KEY}` }),
  }
}

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
        ...requestHeaders(),
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

// App calls this for the first vote only; reservation room changes are local.
// The existing DB still accepts additional votes and counts the latest per visitor.
export async function saveVote(roomId: string): Promise<SaveResult> {
  if (!enabled) return 'disabled'
  const error = await insert('landing_vote', { room_id: roomId, visitor_id: visitorId(), ...captureAttribution() })
  return error ? failed('landing_vote', error) : 'saved'
}

export type PreorderInput = {
  email: string
  marketingConsent: boolean
  // Keep the existing API field name; this is the room selected for reservation.
  votedRoomId: string | null
}

export async function savePreorder(input: PreorderInput): Promise<SaveResult> {
  if (!enabled) return 'disabled'
  const error = await insert('landing_preorder', {
    email: input.email.trim().toLowerCase(),
    privacy_consent: true,
    marketing_consent: input.marketingConsent,
    voted_room_id: input.votedRoomId,
    visitor_id: visitorId(),
    ...captureAttribution(),
  })
  if (!error) return 'saved'
  // 23505 = unique_violation: show the existing-email state without claiming an update.
  if (error.code === '23505') return 'duplicate'
  return failed('landing_preorder', error)
}

export type SurveyInput = {
  picks: Record<string, ReadonlySet<string>>
  wish: string
  roomId: string
}

// Follow-up opinions are separate from the immutable preorder email record.
export async function saveSurvey(input: SurveyInput): Promise<SaveResult> {
  if (!enabled) return 'disabled'
  const error = await insert('landing_survey', {
    visitor_id: visitorId(),
    room_id: input.roomId,
    survey_picks: Object.fromEntries(Object.entries(input.picks).filter(([, picked]) => picked.size > 0).map(([group, picked]) => [group, [...picked]])),
    survey_wish: input.wish.trim() || null,
    privacy_consent: true,
  })
  return error ? failed('landing_survey', error) : 'saved'
}

// "현재까지 N명이 투표했어요" 의 N. 투표한 고유 방문자 수를 DB 함수(landing_vote_total)로 받는다.
// anon 은 테이블을 못 읽지만 이 함수는 숫자 하나만 돌려주므로 열어 뒀다. 실패·미설정이면 null.
//
// 마지막으로 받은 값을 기억해 둔다. 투표 페이지를 나갔다 돌아올 때마다 다시 요청하는데, 응답이
// 오기 전에는 직전 숫자를 보여준다. 처음 요청의 로딩·실패 문구는 RoomsPage 가 처리한다.
let lastVoteTotal: number | null = null
export function lastKnownVoteTotal(): number | null {
  return lastVoteTotal
}

export async function fetchVoteTotal(): Promise<number | null> {
  if (!enabled) return null
  try {
    const res = await fetch(`${BASE_URL}/rest/v1/rpc/landing_vote_total`, {
      method: 'POST',
      headers: requestHeaders(),
      body: '{}',
    })
    if (!res.ok) return null
    const total: unknown = await res.json()
    if (typeof total !== 'number' || !Number.isSafeInteger(total) || total < 0) return null
    lastVoteTotal = total
    return total
  } catch {
    return null
  }
}
