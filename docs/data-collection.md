# 수요 검증 데이터 수집 — 연동 안내

랜딩 페이지에서 일어나는 행동(Mixpanel)과 투표·사전예약 원본(Supabase)을 어디에 어떻게 남기는지 정리한다.
화면·문구·흐름은 바꾸지 않았다. 환경변수가 비어 있으면 수집을 건너뛰고 연동 전과 똑같이 동작한다.

## 구성

| 역할 | 도구 | 키 | 비고 |
| --- | --- | --- | --- |
| 행동 분석 (방문·클릭·전환) | Mixpanel | `VITE_MIXPANEL_TOKEN` (공개 프로젝트 토큰) | 분석용. 사업계획서의 투표 수·이메일 수 원본이 아니다 |
| 투표·사전예약 원본 저장 | Supabase (Postgres) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | anon 키는 INSERT 만 된다 (RLS) |
| 관리자 조회·CSV | Supabase 대시보드 | 대시보드 로그인 | 별도 관리자 화면 없음 |

별도 서버는 없다. 브라우저가 Supabase REST 로 직접 INSERT 하고, 검증은 CHECK 제약·UNIQUE·RLS 가 맡는다.
코드: [`src/lib/analytics.ts`](../src/lib/analytics.ts), [`src/lib/api.ts`](../src/lib/api.ts),
스키마: [`supabase/migrations/2026-10-10_landing_data.sql`](../supabase/migrations/2026-10-10_landing_data.sql).

## 설정 (한 번)

1. **Supabase** — CAPSULE 전용 프로젝트를 새로 만든다 (다른 제품 DB 와 섞지 않는다).
   SQL Editor 에 `supabase/migrations/` 의 파일을 **날짜순으로** 붙여 넣어 실행한다 (`2026-10-10_landing_data.sql` → `2026-10-11_habit_other.sql` → `2026-10-11_insight_views.sql` → `2026-10-11_preorder_trim_and_vote_total.sql`). 두 번 실행해도 안전하다.
   프로젝트 설정 → API 에서 URL 과 **anon(public)** 키를 복사한다. `service_role` 키는 어디에도 넣지 않는다.
2. **Mixpanel** — 프로젝트를 만들고 Settings → Project Settings 의 Project Token 을 복사한다. 언어는 우측 상단 프로필 → 한국어. EU 리전으로 만들었으면 `VITE_MIXPANEL_API_HOST=https://api-eu.mixpanel.com`.
3. 호스팅(Vercel 등)의 환경변수에 `.env.example` 의 값을 넣고 다시 빌드한다. 로컬은 `.env.local` 에 넣는다 (git 무시됨).

`VITE_` 값은 빌드 결과물에 그대로 들어가므로 공개해도 되는 키만 쓴다.

## Mixpanel 이벤트

| 이벤트 | 언제 | 속성 | 위치 |
| --- | --- | --- | --- |
| `$mp_web_page_view` | 경로가 바뀔 때마다 SDK 가 자동 전송 (`track_pageview: 'url-with-path'`) | `current_url_path`, `$current_url` | `src/lib/analytics.ts` |
| `cta_clicked` | 랜딩의 "다른 스터디룸 구경하고 투표하기", 히어로 "스크롤해서 더 알아보기" 클릭 | `cta`: `open_rooms` \| `scroll_hint`, `path` | `Rooms.tsx`, `Hero.tsx` |
| `artwork_vote_submitted` | "이 스터디룸 투표하기" 클릭 후 **DB 저장이 성공했을 때만** | `room_id` | `App.tsx` |
| `presign_cta_clicked` | 수요조사 "다음" 또는 "건너뛰기"로 `/preorder` 에 진입할 때 | `source`: `answered` \| `skipped` | `App.tsx` (SurveyPage `onNext`) |
| `presign_completed` | 사전예약 "입력 내용 확인하기" 후 **DB 저장이 성공했을 때만** | `voted_room_id`, `marketing_consent` | `App.tsx` `reviewPreorder` |
| `presign_duplicate` | 이미 등록된 이메일로 제출 (DB UNIQUE 위반) | `voted_room_id` | `App.tsx` `reviewPreorder` |
| `landing_api_failed` | INSERT 가 실패 (중복 제외) | `table`, `code` (Postgres 에러 코드) | `src/lib/api.ts` |

- 수동 `landing_view` 는 보내지 않는다. `$mp_web_page_view` 의 `current_url_path = /` 가 랜딩 방문이다. 자동 클릭 수집(autocapture)은 꺼서 CTA 이벤트와 중복되지 않는다.
- 이메일, 자유 서술, 나이 등 식별 가능한 값은 어떤 이벤트에도 넣지 않는다.
- `distinct_id` 는 Mixpanel 익명 ID 이고, DB 행의 `visitor_id` 와 같은 값이다. 둘을 이어 볼 수 있다.
- 페이지뷰의 `current_page_title` 은 직전 페이지 제목이 찍힐 수 있다 (제목은 페이지가 그려진 뒤 바뀐다). 경로는 `current_url_path` 로 보면 된다.
- 유입 경로·캠페인은 Mixpanel 이 `$referrer`, `utm_*` 를 자동으로 붙인다. 공유 링크에 `?utm_source=instagram&utm_campaign=…` 를 달면 된다.

## 지표 정의 (사업계획서용)

분모와 분자를 섞지 않는다. 이벤트 횟수 ≠ 사람 수다.

| 지표 | 정의 | 출처 |
| --- | --- | --- |
| 방문자 수 | `$mp_web_page_view` 의 고유 `distinct_id` 수 | Mixpanel |
| 페이지뷰 | `$mp_web_page_view` 이벤트 수 | Mixpanel |
| CTA CTR | `cta_clicked`(cta=open_rooms) 고유 distinct_id ÷ `/` 를 본 고유 distinct_id | Mixpanel |
| 투표자 수 | `landing_vote` 의 고유 `visitor_id` 수 (`landing_funnel_summary.voters`) | DB |
| 작품별 투표 수·비율 | 방문자당 **마지막** 표만 센 `landing_vote_summary.votes`, `share_pct` | DB |
| 투표 전환율 | 투표자 수 ÷ 방문자 수 | DB ÷ Mixpanel |
| 사전예약 시작 수 | `presign_cta_clicked` 고유 distinct_id | Mixpanel |
| 사전예약 완료 수 | `landing_preorder` 행 수 (`landing_preorder_summary.preorders`) | DB |
| 사전예약 전환율 | 사전예약 완료 수 ÷ 방문자 수 | DB ÷ Mixpanel |

- 로그인이 없다. `visitor_id` 는 브라우저 저장소의 익명 ID 라 기기·브라우저를 바꾸면 다른 사람으로 센다. **1인 1표가 보장되지 않는다**고 적는다.
- 사전예약 이메일은 출시 알림 수요다. 유료 구매 의향이 검증된 수치로 쓰지 않는다.

## 질문 → 어디서 답을 보나

원본(Events 목록, 테이블)은 숫자가 아니다. 아래 질문 단위로 보면 의미가 생긴다. 표본이 쌓인 뒤(최소 수십 명) 읽는다.

| 질문 | 답 | 출처 |
| --- | --- | --- |
| 사람이 오긴 하나, 어디서 오나 | 일별 방문자, `utm_source`·`$referring_domain` 별 방문자 | Mixpanel Insights |
| 랜딩에서 투표 페이지로 넘어가는 비율 | CTA CTR | Mixpanel Insights (수식) |
| 방문 → 투표 → 사전예약, 어느 단계에서 빠지나 | 단계별 전환·이탈률 | Mixpanel Funnels |
| 유입 경로별로 전환율이 다른가 (인스타 vs 직접 방문) | 퍼널을 `utm_source` 로 Breakdown | Mixpanel Funnels |
| 어느 룸이 인기인가 | 룸별 유효표·비율 | DB `landing_vote_summary` |
| 어느 룸이 "관심"을 넘어 "이메일"까지 끌어내나 | 룸별 투표 대비 사전예약률 | DB `landing_room_funnel_summary` |
| 어떤 캐릭터(관계·성격·세계관)를 원하나 | 선택지별 비율 | DB `landing_survey_summary` |
| 자유 서술에서 뭘 원한다고 하나 | 원문 목록 | DB `landing_free_text` |
| 사람들이 실제로 어떻게 움직이나 (어디서 멈칫하나) | 세션 재생 | Mixpanel Session Replay |

DB 뷰는 SQL Editor 에서 `select * from <뷰 이름>;` 한 줄이다. 결과 창의 Download 로 CSV 가 된다.

## Mixpanel 에서 숫자 보는 법

mixpanel.com 로그인 → 왼쪽 메뉴. 처음 한 번 우측 상단 프로필 → 언어 → 한국어.

| 보고 싶은 것 | 메뉴 | 설정 |
| --- | --- | --- |
| 지금 이벤트가 들어오는지 | **Events** (이벤트) | 실시간 목록. 랜딩을 열고 새로고침하면 `$mp_web_page_view` 가 몇 초 안에 떠야 한다 |
| 방문자 수 | **Insights** → 이벤트 `$mp_web_page_view` | 집계를 **Unique users** 로. `Total` 이면 페이지뷰 |
| 랜딩 방문자만 | 위와 같음 + 필터 | `current_url_path` = `/` |
| 유입 경로 | 위와 같음 + Breakdown | `utm_source` 또는 `$referring_domain` |
| CTA CTR | Insights 에 이벤트 2개: A `$mp_web_page_view`(필터 `/`), B `cta_clicked`(필터 `cta` = `open_rooms`) | 둘 다 Unique users → 상단 **Formula** 에 `B/A` |
| 방문 → 투표 → 사전예약 전환율 | **Funnels** | 단계: `$mp_web_page_view` → `artwork_vote_submitted` → `presign_completed`. 전환 기간 7일 |
| 룸별 투표 (대략) | Insights → `artwork_vote_submitted` | Breakdown `room_id`. ⚠️ 정확한 수치는 DB `landing_vote_summary` |
| 사전예약 시작 vs 완료 | Funnels | `presign_cta_clicked` → `presign_completed` |

### 데이터가 들어오는지 정확히 확인하는 순서

1. 랜딩을 연다 (배포 주소 또는 `npm run dev` 후 localhost:5173). 투표까지 한 번 눌러 본다.
2. Mixpanel → 왼쪽 **Events** → 상단이 **Live view** 인지 확인. 몇 초 안에 `$mp_web_page_view`, `cta_clicked`, `artwork_vote_submitted` 가 위에서부터 쌓인다. 안 보이면 새로고침.
3. 이벤트 한 줄을 클릭하면 속성이 펼쳐진다. `room_id`, `current_url_path`, `distinct_id` 가 보이면 정상. 이메일이 어디에도 없어야 한다.
4. 같은 `distinct_id` 가 Supabase `landing_vote.visitor_id` 에 있는지 대조하면 두 쪽이 연결된 것이다.
5. 숫자가 Insights 에 반영되는 데는 보통 1~2분 걸린다. Live view 는 즉시다.

### 세션 재생 (Session Replay)

웹에서 된다. `record_sessions_percent: 100` 으로 전부 녹화한다 (무료 플랜 월 1만 건, 출시 전엔 충분).
- 보는 곳: 왼쪽 **Session Replay** 메뉴, 또는 Events 에서 이벤트 클릭 → **View Replay**.
- 녹화기(rrweb)는 번들에 없고 사용자가 들어온 뒤 Mixpanel CDN(`cdn.mxpnl.com`)에서 받는다. 랜딩 로딩 속도에 영향 없음.
- 입력창은 전부 가려진다(기본값 `record_mask_inputs`). 이메일·자유 서술은 재생에 나오지 않는다.
- 녹화를 끄려면 `analytics.ts` 의 `record_sessions_percent` 를 0 으로.

만든 리포트는 **Boards** 에 저장해 두면 사업계획서 쓸 때 그대로 캡처할 수 있다.

Mixpanel 은 사람 수를 브라우저 기준(`distinct_id`)으로 세므로 같은 사람이 폰과 노트북으로 오면 2명이다. 정확한 투표·사전예약 수는 항상 DB 쪽 숫자를 쓴다.

## DB

| 테이블 / 뷰 | 내용 |
| --- | --- |
| `landing_vote` | 투표 원본. `room_id`(rooms.ts 의 id, CHECK), `visitor_id`, `created_at`. 재투표는 행이 하나 더 들어간다 |
| `landing_preorder` | 사전예약 원본. `email`(소문자, UNIQUE, 형식 CHECK), `survey_picks`, `survey_wish`, `privacy_consent`(반드시 true), `marketing_consent`, `voted_room_id`, `visitor_id`, `created_at` |
| `landing_vote_total()` | 함수. 투표한 고유 방문자 수 정수 하나. **anon 호출 허용** — 투표 페이지 "현재까지 N명" 용 |
| `landing_vote_summary` | 룸별 유효표(`votes`), 비율(`share_pct`), 재투표 포함 전체(`raw_votes`) |
| `landing_preorder_summary` | 총계, 마케팅 동의 수, 투표 포함 수, 처음·마지막 등록 시각 |
| `landing_funnel_summary` | 투표자 수, 전체 표 수, 사전예약 수 한 줄 |
| `landing_room_funnel_summary` | 룸별 유효표 → 그 룸으로 사전예약한 수, 전환율 |
| `landing_survey_summary` | 관계·성격·세계관 선택지별 사전예약자 수·비율 |
| `landing_free_text` | 자유 서술 원문 (캐릭터 희망) |

중복 정책: 같은 이메일은 두 번 저장되지 않는다(UNIQUE). 사용자에게는 완료 화면을 그대로 보여주고 `presign_duplicate` 로만 구분한다.
같은 방문자의 재투표는 저장은 되지만 집계에서는 마지막 표만 센다.

### 관리자 조회

Supabase 대시보드 → Table Editor 에서 `landing_preorder` 를 열면 목록이 보이고 **Export → CSV** 로 내려받을 수 있다. 집계는 SQL Editor 에서:

```sql
select * from landing_vote_summary;
select * from landing_preorder_summary;
select * from landing_funnel_summary;
-- 사전예약자 목록 (CSV 는 결과 창의 Download)
select email, age, marketing_consent, voted_room_id, created_at from landing_preorder order by created_at;
```

"현재까지 N명이 투표했어요" 의 N 은 `landing_vote_total()` 함수로 받는다 (`RoomsPage.tsx`). 테이블은 여전히 anon 이 못 읽고, 이 함수만 정수 하나를 돌려준다.

### 개인정보

- `landing_preorder.email` 은 개인정보다. 약관대로 서비스 출시 후 6개월이 지나면 삭제한다.
- 대시보드 접근 권한이 곧 개인정보 접근 권한이다. 필요한 사람에게만 준다.
- 수신 동의 철회 요청이 오면 `marketing_consent` 를 false 로 바꾼다.

## 알려진 한계

- **속도 제한 없음.** anon 키로 INSERT 가 열려 있어 스크립트로 쓰레기 행을 넣을 수 있다. 형식 CHECK 와 UNIQUE 가 거를 뿐이다. 실제로 당하면 INSERT 를 Edge Function 하나로 옮기고 IP 당 제한을 건다.
- **투표 저장 실패는 사용자에게 알리지 않는다.** 실패해도 다음 화면으로 넘어가고 콘솔과 `landing_api_failed` 에만 남는다. 사전예약은 다르다 — 저장 실패 시 `reviewPreorder` 가 throw 해서 PreorderPage 의 기존 오류 문구가 뜨고 입력은 유지된다.
- **사전예약 화면 문구가 연동 전 상태다.** "지금은 입력 내용만 확인할 수 있어요. 예약 정보는 전송되지 않아요." 안내와 "입력 내용 확인하기" 버튼은 이제 사실과 다르다(실제로 저장된다). 문구는 프론트 소관이라 손대지 않았다 — 프론트에서 고쳐야 한다.
- 룸을 추가하면 `landing_vote.room_id` CHECK 도 같이 고쳐야 한다. 안 고치면 그 룸 투표는 저장이 실패한다.
- `mixpanel-browser` 는 core 엔트리(`src/loaders/loader-module-core`, 세션 녹화·autocapture 제외)로 넣었다. 전체 번들 약 120 kB(gzip). 더 줄여야 하면 `initAnalytics` 안에서 동적 `import()` 로 바꾼다.
- Mixpanel 은 브라우저 저장소(localStorage)에 익명 ID 를 둔다. 푸터의 개인정보처리방침 링크(지금은 `#`)에 분석 도구 사용을 적어야 한다.

## 검증 기록 (2026-10-10)

- 마이그레이션을 PGlite(Postgres 17 WASM)에서 실행해 확인: anon INSERT 허용, 잘못된 `room_id`·대문자 이메일·형식 오류·동의 없음은 23514 로 거부, 중복 이메일은 23505, anon SELECT/UPDATE/DELETE 는 0행, anon 의 집계 뷰 조회는 42501, 재투표 시 마지막 표만 집계, 두 번 적용해도 오류 없음.
- 모의 Supabase/Mixpanel 서버에 붙여 전체 흐름(랜딩 → 투표 → 수요조사 → 사전예약 → 완료)을 돌려 확인: 경로당 `$mp_web_page_view` 1건, 이벤트 순서대로 전송, 이메일은 소문자로 INSERT, `visitor_id` = Mixpanel `distinct_id`, Mixpanel 본문 어디에도 이메일 없음.
- 환경변수를 비운 상태에서 기존 흐름이 그대로 동작하고 외부 요청이 나가지 않음.
- **실제 Supabase 프로젝트(idviltrngwmvyanxbben)와 Mixpanel 에 붙여 확인**: publishable 키로 curl 11개 항목(INSERT 201, 잘못된 room_id·대문자 이메일·동의 없음 400/23514, 중복 이메일 409/23505, anon SELECT/UPDATE/DELETE 0행, 집계 뷰 401/42501) 통과. 브라우저로 랜딩 → 투표 → 수요조사 → 사전예약 → 완료를 돌려 `landing_vote`·`landing_preorder` INSERT 와 Mixpanel `/track` 전송 확인, 콘솔 오류 없음. 테스트 행(`*@example.com`, visitor `curl-check-*`)은 대시보드에서 지우면 된다.
