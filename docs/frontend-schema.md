# 프론트 연동 스키마

랜딩 페이지가 데이터를 저장·전송하는 규격. 프론트는 아래 저장·집계 함수를 사용하며, 직접 HTTP 를 만들 일은 없다.
구현: [`src/lib/api.ts`](../src/lib/api.ts), [`src/lib/analytics.ts`](../src/lib/analytics.ts). 전체 배경은 [`data-collection.md`](./data-collection.md). UI는 저장 성공·중복·실패에 맞춰 완료 안내를 구분한다.

## 1. 환경변수

| 이름 | 값 | 없으면 |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | `https://idviltrngwmvyanxbben.supabase.co` | 저장 함수가 `'disabled'` 를 돌려주고 아무것도 안 함 |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_…` (공개용) | 위와 같음 |
| `VITE_MIXPANEL_TOKEN` | Mixpanel Project Token (공개용) | `track()` 이 no-op |
| `VITE_MIXPANEL_API_HOST` | (선택) EU 리전이면 `https://api-eu.mixpanel.com` | 미국 리전 |

`VITE_` 값은 빌드 결과에 그대로 들어간다. `service_role`·`sb_secret_` 키는 절대 넣지 않는다.

## 2. 프론트가 부르는 함수

```ts
import { saveVote, savePreorder, saveSurvey, type SaveResult } from './lib/api.ts'
import { track, visitorId } from './lib/analytics.ts'

type SaveResult = 'saved' | 'duplicate' | 'failed' | 'disabled'
```

| 함수 | 언제 | 반환 |
| --- | --- | --- |
| `saveVote(roomId: string)` | "이 스터디룸 투표하기" 클릭 | `saved` \| `failed` \| `disabled` |
| `savePreorder(input: PreorderInput)` | 사전예약 제출 | `saved` \| `duplicate`(이미 등록된 이메일) \| `failed` \| `disabled` |
| `saveSurvey(input: SurveyInput)` | 예약 완료 후 선택 설문 제출 | `saved` \| `failed` \| `disabled` |
| `track(event, props?)` | 아래 4절의 이벤트 | 없음 |
| `fetchVoteTotal()` | 투표 페이지 진입 시 ("현재까지 N명") | `number` \| `null`(초기 로딩·실패 안내, 이전 집계가 있으면 캐시 유지) |
| `visitorId()` | 필요할 때 | 브라우저 익명 ID 문자열 |

저장 함수는 **throw 하지 않는다.** 실패는 반환값으로 알린다.

- 투표(`App.handleVote`): `saved`일 때 같은 오버레이에 투표 성공과 `좋아요` 하나를 표시하고, 배경을 `/preorder`로 바꾼다. 실패·미설정이면 상세 카드에 오류를 표시하고 재시도한다.
- 최초 투표가 저장된 뒤 룸을 변경하면 `selectedRoomId`(예약 초안)만 바꾼다. `votedRoomId`(원래 투표)는 유지하며 `saveVote`와 투표 분석 이벤트를 다시 호출하지 않는다. 같은 오버레이에 `변경 성공!`·투표 변경 불가 안내·`괜찮아요`를 표시하고 배경의 예약 포스터를 교체한다.
- 사전예약(`App.submitPreorder`): `'failed'`·`'disabled'`면 오류 안내 후 입력을 유지한다. `'saved'`일 때 예약 완료를 표시하고, `'duplicate'`는 이미 등록한 이메일이라는 별도 안내를 표시한다. 중복 응답으로 기존 룸·동의가 수정됐다고 안내하지 않는다.

```ts
type PreorderInput = {
  email: string                                   // 그대로 넘기면 trim·소문자화해서 저장
  marketingConsent: boolean
  votedRoomId: string | null                      // 최종 예약 룸. 원래 투표한 룸과 다를 수 있음
}

type SurveyInput = {
  picks: Record<string, ReadonlySet<string>> // relation/personality/world
  wish: string                              // trim 후 빈 문자열이면 null
  roomId: string
}
```

설문은 예약 완료 화면의 `나만의 세계 만들어보기`로 진입한다. `saveSurvey`가 `saved`일 때 `/done`으로 돌아가 감사 문구를 표시하며 기존 예약 완료 정보를 유지한다. 실패·미설정이면 입력을 보존한다. 빈 그룹은 payload에서 제외하며 `Set`은 문자열 배열로 변환한다.

## 3. Supabase REST 규격 (함수 안에서 일어나는 일)

`POST {VITE_SUPABASE_URL}/rest/v1/{table}`
헤더 `apikey`, `Content-Type: application/json`, `Prefer: return=minimal`. 기존 anon JWT에는 `Authorization: Bearer <anon>`도 사용하고, publishable key는 `apikey`에만 보낸다. [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys#known-limitations)

투표·사전예약에는 첫 진입 때의 유입 정보도 자동으로 포함된다. DB에 [`2026-10-12_attribution.sql`](../supabase/migrations/2026-10-12_attribution.sql)이 적용되어 있어야 한다. 같은 날짜의 `2026-10-12_joseon_room.sql`과는 별도 파일이다.

### `landing_vote`

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| `room_id` | string | O | `smile` `lantern` `top` `fenesis` `cat` `iljin` `jurassic` `lab` `joseon` 중 하나. DB는 과거 데이터용 `baekdojun`도 허용한다. 새 포스터 사용 전 `2026-10-12_joseon_room.sql` 적용 필요. ⚠️ `rooms.ts` 에 룸을 추가하면 DB CHECK 도 같이 고쳐야 한다 |
| `visitor_id` | string | O | 8~64자 |
| `utm_source`, `utm_medium`, `utm_campaign`, `referrer`, `landing_path` | string \| null | | 첫 진입 때 자동으로 채움 (`captureAttribution`). 프론트가 넘길 필요 없음 |

### `landing_preorder`

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| `email` | string | O | 소문자, 이메일 형식, 254자 이하, **UNIQUE** |
| `survey_picks` | object | | 과거 설문용 컬럼. 새 예약 요청에서는 보내지 않으며 기본 `{}` |
| `survey_wish` | string \| null | | 과거 설문용 컬럼. 새 예약 요청에서는 보내지 않으며 기본 `null` |
| `privacy_consent` | boolean | O | **반드시 `true`**. 아니면 거부 |
| `marketing_consent` | boolean | | 기본 `false` |
| `voted_room_id` | string \| null | | 40자 이하. 기존 필드명을 유지하며 **예약 시 선택한 룸**을 보낸다. 처음 투표한 `landing_vote.room_id`와 다를 수 있다 |
| `visitor_id` | string | O | 8~64자 |
| `utm_source`, `utm_medium`, `utm_campaign`, `referrer`, `landing_path` | string \| null | | 첫 진입 때 자동으로 채움. 프론트가 넘길 필요 없음 |

### `landing_survey` (예약 이후 응답)

기존 DB에 [`2026-10-13_post_reservation_survey.sql`](../supabase/migrations/2026-10-13_post_reservation_survey.sql)을 추가 적용해야 한다. 예약 테이블은 변경하지 않는다.

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| `visitor_id` | string | O | 8~64자 |
| `room_id` | string | O | 1~40자 |
| `survey_picks` | object | O | `relation`·`personality`·`world`만 허용. 각 값은 문자열 배열. 미선택 그룹은 제외 |
| `survey_wish` | string \| null | | DB 최대 1000자, 화면 최대 500자 |
| `privacy_consent` | boolean | O | 예약 때 받은 동의에 따라 `true` |

최소 하나의 선택 또는 빈 값이 아닌 자유 입력이 있어야 저장된다. 이메일은 이 요청에 포함하지 않는다. 익명 `visitor_id`는 집계 식별자이며 인증된 예약 ID가 아니다. 프런트는 예약 완료 상태에서만 설문 제출을 제공하지만 DB가 예약 소유자를 인증하지는 않는다.

서버가 채우는 것: `vote_id`/`preorder_id`/`survey_id`(UUID), `created_at`.

### 응답

| HTTP | `code` | 뜻 | 함수 반환 |
| --- | --- | --- | --- |
| 201 | | 저장됨 | `saved` |
| 409 | `23505` | 이메일 중복 | `duplicate` |
| 400 | `23514` | CHECK 위반 (잘못된 room_id, 이메일 형식, 동의 false 등) | `failed` |
| 401 / 404 | | 키 오류 / 테이블 없음 | `failed` |
| 네트워크 오류 | | | `failed` |

`landing_vote`·`landing_preorder`는 anon 읽기·수정·삭제 시 0행이다. 새 `landing_survey`는 INSERT 권한만 부여해 읽기·수정·삭제 요청을 권한 오류로 거부한다. 원본 조회는 관리자 대시보드에서 한다.

### 투표 수 (읽기 예외 하나)

`POST {VITE_SUPABASE_URL}/rest/v1/rpc/landing_vote_total` (본문 `{}`) → `123` 같은 정수 하나. 투표한 고유 방문자 수다.
`RoomsPage`가 진입 시 한 번 부른다. 첫 요청 중에는 로딩 안내, 실패 시에는 조회 실패 안내를 표시한다. 이전 집계가 있으면 다시 요청하는 동안 그 값을 유지한다. null·음수·소수 응답을 0명으로 바꾸지 않는다.

## 4. Mixpanel 이벤트

| 이벤트 | 속성 | 어디서 |
| --- | --- | --- |
| `$mp_web_page_view` | `current_url_path` 등 (SDK 자동) | 경로 바뀔 때마다 자동. 수동으로 보내지 말 것 |
| `cta_clicked` | `cta`: `open_rooms` \| `scroll_hint`, `path` | `Rooms.tsx`, `Hero.tsx` |
| `artwork_vote_submitted` | `room_id` | `App.tsx` — `saveVote` 가 `saved` 일 때만 |
| `presign_cta_clicked` | `source`: `vote` | `App.tsx` — 투표 저장 성공 후 예약 진입 |
| `survey_cta_clicked` | `room_id` | `App.tsx` — 완료 화면의 설문 버튼 |
| `survey_completed` | `room_id` | `App.tsx` — 설문 저장 성공 |
| `presign_completed` | `voted_room_id`, `marketing_consent` | `App.tsx` `submitPreorder` — `saved` 일 때만 |
| `presign_duplicate` | `voted_room_id` | `App.tsx` `submitPreorder` — `duplicate` 일 때 |
| `landing_api_failed` | `table`, `code` | `api.ts` 내부 |

새 이벤트를 추가하려면 `analytics.ts` 의 `EventName` 유니온에 이름을 넣고 `track()` 을 부른다.
**이메일·자유 서술·나이 등 사람을 식별할 수 있는 값은 속성에 넣지 않는다.**

## 5. 관리자 집계 (프론트에서 호출 불가)

집계 뷰는 대시보드 SQL Editor 전용이다. 공개 화면의 투표 수는 anon 호출을 허용한 `landing_vote_total()` 함수에서 정수 하나만 받는다.

| 뷰 | 컬럼 |
| --- | --- |
| `landing_vote_summary` | `room_id`, `votes`(방문자당 마지막 표), `share_pct`, `raw_votes` |
| `landing_preorder_summary` | `preorders`, `marketing_opt_in`, `with_vote`, `visitors`, `first_at`, `last_at` |
| `landing_funnel_summary` | `voters`, `raw_votes`, `preorders` |
| `landing_source_summary` | `source`(utm_source → referrer → 직접/메신저), `voters`, `preorders`, `preorder_rate_pct` |
| `landing_survey_latest` | 익명 방문자별 최신 응답. 기존 예약에 포함된 과거 설문도 합침 |
| `landing_survey_summary` | `group_id`, `label`, `picks`, `share_pct` (선택 응답을 한 방문자 수가 분모) |
| `landing_free_text` | `created_at`, `text`, `voted_room_id` (방문자별 최신 자유 입력) |
