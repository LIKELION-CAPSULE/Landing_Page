import { track, visitorId } from './analytics.ts'

// Supabase REST(PostgREST)에 anon 키로 직접 INSERT 한다. 검증·중복 제한·읽기 차단은 DB 제약과 RLS 가
// 맡는다 (supabase/migrations/2026-10-10_landing_data.sql). 둘 다 비어 있으면 저장을 건너뛰고
// 화면 흐름만 진행한다 — 연동 전과 같은 동작.
// ponytail: supabase-js 대신 fetch 두 번. INSERT 외에 쓰는 기능이 없어 SDK(약 40 kB gzip)가 값을 못 한다.
const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const enabled = Boolean(URL && ANON_KEY)

type PgError = { code?: string; message: string }

// 성공이면 null, 실패면 PostgREST 오류 본문({code, message}). 네트워크 오류는 code 없이 message 만.
async function insert(table: string, row: Record<string, unknown>): Promise<PgError | null> {
  try {
    const res = await fetch(`${URL}/rest/v1/${table}`, {
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
  const error = await insert('landing_vote', { room_id: roomId, visitor_id: visitorId() })
  return error ? failed('landing_vote', error) : 'saved'
}

export type PreorderInput = {
  email: string
  age: string
  habits: readonly string[]
  surveyPicks: Record<string, ReadonlySet<string>>
  surveyWish: string
  marketingConsent: boolean
  votedRoomId: string | null
}

export async function savePreorder(input: PreorderInput): Promise<SaveResult> {
  if (!enabled) return 'disabled'
  const error = await insert('landing_preorder', {
    email: input.email.trim().toLowerCase(),
    age: input.age || null,
    habits: [...input.habits],
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
  // 23505 = unique_violation: 이미 등록된 이메일. 사용자에게는 완료로 보여주고 집계만 구분한다.
  if (error.code === '23505') return 'duplicate'
  return failed('landing_preorder', error)
}
