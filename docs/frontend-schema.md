# 프론트 연동 스키마

랜딩 페이지가 데이터를 저장·전송하는 규격. 프론트는 아래 함수 3개만 부르면 되고, 직접 HTTP 를 만들 일은 없다.
구현: [`src/lib/api.ts`](../src/lib/api.ts), [`src/lib/analytics.ts`](../src/lib/analytics.ts). 전체 배경은 [`data-collection.md`](./data-collection.md).

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
import { saveVote, savePreorder, type SaveResult } from './lib/api.ts'
import { track, visitorId } from './lib/analytics.ts'

type SaveResult = 'saved' | 'duplicate' | 'failed' | 'disabled'
```

| 함수 | 언제 | 반환 |
| --- | --- | --- |
| `saveVote(roomId: string)` | "이 스터디룸 투표하기" 클릭 | `saved` \| `failed` \| `disabled` |
| `savePreorder(input: PreorderInput)` | 사전예약 제출 | `saved` \| `duplicate`(이미 등록된 이메일) \| `failed` \| `disabled` |
| `track(event, props?)` | 아래 4절의 이벤트 | 없음 |
| `visitorId()` | 필요할 때 | 브라우저 익명 ID 문자열 |

둘 다 **절대 throw 하지 않는다.** 실패는 반환값으로만 알린다. 지금 화면 코드는 반환값과 무관하게 다음 화면으로 간다. 실패 안내 UI 를 붙이려면 `'failed'` 를 받아 처리하면 된다.

```ts
type PreorderInput = {
  email: string                                   // 그대로 넘기면 trim·소문자화해서 저장
  age: string                                     // '' 이면 null
  habits: readonly string[]                       // 공부 방식 체크 목록
  surveyPicks: Record<string, ReadonlySet<string>> // { relation: Set, personality: Set, world: Set }
  surveyWish: string                              // '' 이면 null
  marketingConsent: boolean
  votedRoomId: string | null
}
```

## 3. Supabase REST 규격 (함수 안에서 일어나는 일)

`POST {VITE_SUPABASE_URL}/rest/v1/{table}`
헤더 `apikey`, `Authorization: Bearer <anon>`, `Content-Type: application/json`, `Prefer: return=minimal`

### `landing_vote`

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| `room_id` | string | O | `smile` `lantern` `top` `fenesis` `cat` `baekdojun` `jurassic` `iljin` `lab` 중 하나. ⚠️ `rooms.ts` 에 룸을 추가하면 DB CHECK 도 같이 고쳐야 한다 |
| `visitor_id` | string | O | 8~64자 |

### `landing_preorder`

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| `email` | string | O | 소문자, 이메일 형식, 254자 이하, **UNIQUE** |
| `age` | string \| null | | 20자 이하 |
| `habits` | string[] | | 10개 이하 (기본 `[]`) |
| `survey_picks` | object | | `{ [groupId]: string[] }` (기본 `{}`) |
| `survey_wish` | string \| null | | 1000자 이하 |
| `privacy_consent` | boolean | O | **반드시 `true`**. 아니면 거부 |
| `marketing_consent` | boolean | | 기본 `false` |
| `voted_room_id` | string \| null | | 40자 이하 |
| `visitor_id` | string | O | 8~64자 |

서버가 채우는 것: `vote_id`/`preorder_id`(UUID), `created_at`.

### 응답

| HTTP | `code` | 뜻 | 함수 반환 |
| --- | --- | --- | --- |
| 201 | | 저장됨 | `saved` |
| 409 | `23505` | 이메일 중복 | `duplicate` |
| 400 | `23514` | CHECK 위반 (잘못된 room_id, 이메일 형식, 동의 false 등) | `failed` |
| 401 / 404 | | 키 오류 / 테이블 없음 | `failed` |
| 네트워크 오류 | | | `failed` |

anon 키로 GET/PATCH/DELETE 를 보내면 에러 없이 **0행**이 돌아온다. 읽기는 Supabase 대시보드에서만 한다.

## 4. Mixpanel 이벤트

| 이벤트 | 속성 | 어디서 |
| --- | --- | --- |
| `$mp_web_page_view` | `current_url_path` 등 (SDK 자동) | 경로 바뀔 때마다 자동. 수동으로 보내지 말 것 |
| `cta_clicked` | `cta`: `open_rooms` \| `scroll_hint`, `path` | `Rooms.tsx`, `Hero.tsx` |
| `artwork_vote_submitted` | `room_id` | `App.tsx` — `saveVote` 가 `saved` 일 때만 |
| `presign_cta_clicked` | `source`: `survey_submit` \| `survey_skip` | `SurveyPage.tsx` |
| `presign_completed` | `voted_room_id`, `marketing_consent` | `PreorderPage.tsx` — `savePreorder` 가 `saved` 일 때만 |
| `presign_duplicate` | `voted_room_id` | `PreorderPage.tsx` — `duplicate` 일 때 |
| `landing_api_failed` | `table`, `code` | `api.ts` 내부 |

새 이벤트를 추가하려면 `analytics.ts` 의 `EventName` 유니온에 이름을 넣고 `track()` 을 부른다.
**이메일·자유 서술·나이 등 사람을 식별할 수 있는 값은 속성에 넣지 않는다.**

## 5. 관리자 집계 (프론트에서 호출 불가)

대시보드 SQL Editor 전용. anon 키로 부르면 401. 나중에 "현재까지 N명" 같은 숫자를 화면에 띄우려면 서버 함수 하나가 필요하다(이번 범위 밖).

| 뷰 | 컬럼 |
| --- | --- |
| `landing_vote_summary` | `room_id`, `votes`(방문자당 마지막 표), `share_pct`, `raw_votes` |
| `landing_preorder_summary` | `preorders`, `marketing_opt_in`, `with_vote`, `visitors`, `first_at`, `last_at` |
| `landing_funnel_summary` | `voters`, `raw_votes`, `preorders` |
