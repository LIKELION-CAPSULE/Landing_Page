import { createClient } from '@supabase/supabase-js'
import { track, visitorId } from './analytics.ts'

// Supabase anon 키로 직접 INSERT 한다. 검증·중복 제한·읽기 차단은 DB 제약과 RLS 가 맡는다
// (supabase/migrations/2026-10-10_landing_data.sql). 둘 다 비어 있으면 저장을 건너뛰고
// 화면 흐름만 진행한다 — 연동 전과 같은 동작.
const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const client = URL && ANON_KEY ? createClient(URL, ANON_KEY, { auth: { persistSession: false } }) : null

export type SaveResult = 'saved' | 'duplicate' | 'failed' | 'disabled'

function failed(table: string, error: { code?: string; message: string }): SaveResult {
  console.error(`[landing] ${table} 저장 실패`, error)
  track('landing_api_failed', { table, code: error.code ?? null })
  return 'failed'
}

// 같은 방문자가 다시 투표하면 행이 하나 더 들어간다. 집계 뷰(landing_vote_summary)가
// 방문자당 마지막 표만 센다 — anon 에 UPDATE 를 열지 않기 위해서다.
export async function saveVote(roomId: string): Promise<SaveResult> {
  if (!client) return 'disabled'
  const { error } = await client.from('landing_vote').insert({ room_id: roomId, visitor_id: visitorId() })
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
  if (!client) return 'disabled'
  const { error } = await client.from('landing_preorder').insert({
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
