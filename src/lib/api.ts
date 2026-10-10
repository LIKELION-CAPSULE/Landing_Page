import { track, visitorId } from './analytics.ts'

// Supabase REST(PostgREST)에 anon 키로 직접 INSERT 한다. 검증·중복 제한·읽기 차단은 DB 제약과 RLS 가
// 맡는다 (supabase/migrations/). 연결이 없으면 disabled 를 반환한다.
// 사전예약 완료 화면은 실제 저장 성공 또는 중복 확인 응답이 있어야 열린다.
// ponytail: supabase-js 대신 fetch 두 번. INSERT 외에 쓰는 기능이 없어 SDK(약 40 kB gzip)가 값을 못 한다.
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

// 같은 방문자가 다시 투표하면 행이 하나 더 들어간다. 집계 뷰(landing_vote_summary)가
// 방문자당 마지막 표만 센다 — anon 에 UPDATE 를 열지 않기 위해서다.
export async function saveVote(roomId: string): Promise<SaveResult> {
  if (!enabled) return 'disabled'
  const error = await insert('landing_vote', { room_id: roomId, visitor_id: visitorId() })
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
  })
  if (!error) return 'saved'
  // 23505 = unique_violation: show the existing-email state without claiming an update.
  if (error.code === '23505') return 'duplicate'
  return failed('landing_preorder', error)
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
