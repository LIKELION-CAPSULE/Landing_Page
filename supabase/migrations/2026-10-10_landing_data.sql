-- 랜딩 수요검증 데이터 — 투표·사전예약 원본 저장 (2026-10-10)
--
-- 적용: Supabase 대시보드 > SQL Editor 에 그대로 붙여 넣어 실행한다.
--
-- 설계
--   · 서버 없이 브라우저가 anon 키로 INSERT 만 한다. 그래서 검증은 CHECK 제약,
--     중복 제한은 UNIQUE, 읽기 차단은 RLS 가 맡는다.
--   · anon 은 INSERT 만 된다. SELECT 정책이 없으므로 anon 으로는 아무 행도 못 읽는다.
--   · 조회는 Supabase 대시보드(로그인 = 서버측 인증) 또는 service_role 키로만 한다.
--   · PostHog 는 행동 분석용이고, 사업계획서에 쓰는 투표 수·이메일 수의 원본은 이 테이블이다.
--
-- ponytail: 속도 제한이 없다. anon 키를 아는 사람이 스크립트로 쓰레기 행을 넣을 수 있다.
--   UNIQUE(email) 과 CHECK 가 형식을 걸러 줄 뿐이다. 실제로 당하면 INSERT 를
--   Edge Function 하나로 옮기고 IP 당 제한을 건다.

begin;

-- ── 투표 ──────────────────────────────────────────────────────────────────────
create table if not exists landing_vote (
    vote_id     uuid        primary key default gen_random_uuid(),
    -- src/data/rooms.ts 의 id 와 같아야 한다. ⚠️ 룸을 추가하면 이 CHECK 도 같이 고친다.
    --   안 고치면 그 룸 투표는 저장이 실패하고 PostHog 에 landing_api_failed 로 남는다.
    room_id     text        not null
                check (room_id in ('smile', 'lantern', 'top', 'fenesis', 'cat',
                                   'baekdojun', 'jurassic', 'iljin', 'lab')),
    -- 브라우저가 만든 익명 ID (PostHog distinct_id). 로그인이 없으므로 1인 1표를
    -- 보장하지 못한다 — 브라우저·기기를 바꾸면 다른 사람으로 센다.
    visitor_id  text        not null check (char_length(visitor_id) between 8 and 64),
    created_at  timestamptz not null default now()
);

comment on table landing_vote is
    '스터디룸 투표 원본. 같은 visitor_id 의 여러 행 중 마지막 것만 유효표다 (landing_vote_summary).';

create index if not exists landing_vote_visitor_idx on landing_vote (visitor_id, created_at desc);

-- ── 사전예약 ──────────────────────────────────────────────────────────────────
create table if not exists landing_preorder (
    preorder_id       uuid        primary key default gen_random_uuid(),
    -- 소문자로 정규화해서 넣는다(src/lib/api.ts). 같은 주소의 대소문자 변형이 두 행이 되지 않게.
    email             text        not null unique
                      check (email = lower(email)
                             and email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'
                             and char_length(email) <= 254),
    -- 나이 선택지는 아직 임시값(README)이라 목록 CHECK 를 걸지 않는다.
    age               text        check (char_length(age) <= 20),
    habits            text[]      not null default '{}' check (cardinality(habits) <= 10),
    -- {"relation": ["선배", ...], "personality": [...], "world": [...]}
    survey_picks      jsonb       not null default '{}'::jsonb,
    survey_wish       text        check (char_length(survey_wish) <= 1000),
    -- [필수] 개인정보 수집·이용 동의. 동의 없이는 행이 생길 수 없다.
    privacy_consent   boolean     not null check (privacy_consent),
    -- [선택] 이벤트·혜택 정보 수신 동의
    marketing_consent boolean     not null default false,
    -- 사전예약 직전에 투표한 룸. /preorder 로 바로 들어오면 null.
    voted_room_id     text        check (voted_room_id is null or char_length(voted_room_id) <= 40),
    visitor_id        text        not null check (char_length(visitor_id) between 8 and 64),
    created_at        timestamptz not null default now()
);

comment on table landing_preorder is
    '이메일 사전예약 원본. ⚠️ 개인정보 — 약관대로 서비스 출시 후 6개월이 지나면 파기한다. '
    '유료 구매 의향이 검증된 데이터가 아니다 (사업계획서에서 구매 수요로 쓰지 말 것).';

-- ── RLS: anon 은 INSERT 만 ───────────────────────────────────────────────────
alter table landing_vote     enable row level security;
alter table landing_preorder enable row level security;

drop policy if exists landing_vote_insert_anon on landing_vote;
create policy landing_vote_insert_anon
    on landing_vote for insert to anon with check (true);

drop policy if exists landing_preorder_insert_anon on landing_preorder;
create policy landing_preorder_insert_anon
    on landing_preorder for insert to anon with check (true);

-- SELECT/UPDATE/DELETE 정책은 만들지 않는다. 없는 것이 곧 정책이다 — anon 은 읽지 못한다.

-- ── 집계 뷰 (관리자 조회용) ────────────────────────────────────────────────────
-- security_invoker: 뷰를 보는 역할의 RLS 를 그대로 적용한다. 이게 없으면 뷰가 소유자
-- (postgres) 권한으로 돌아 anon 도 집계를 읽을 수 있다.

-- 룸별 유효표 = 방문자당 마지막 표. raw_votes 는 재투표를 포함한 전체 행 수.
create or replace view landing_vote_summary
    with (security_invoker = true) as
with latest as (
    select distinct on (visitor_id) room_id, visitor_id
    from landing_vote
    order by visitor_id, created_at desc
)
select
    r.room_id,
    count(l.visitor_id)                                        as votes,
    round(100.0 * count(l.visitor_id)
          / nullif((select count(*) from latest), 0), 1)       as share_pct,
    (select count(*) from landing_vote v where v.room_id = r.room_id) as raw_votes
from unnest(array['smile', 'lantern', 'top', 'fenesis', 'cat',
                  'baekdojun', 'jurassic', 'iljin', 'lab']) as r(room_id)
left join latest l on l.room_id = r.room_id
group by r.room_id
order by votes desc, r.room_id;

create or replace view landing_preorder_summary
    with (security_invoker = true) as
select
    count(*)                                   as preorders,
    count(*) filter (where marketing_consent)  as marketing_opt_in,
    count(*) filter (where voted_room_id is not null) as with_vote,
    count(distinct visitor_id)                 as visitors,
    min(created_at)                            as first_at,
    max(created_at)                            as last_at
from landing_preorder;

-- 투표자 수(고유 방문자)와 사전예약자 수를 한 줄로. 전환율 분모(방문자)는 PostHog 에 있다.
create or replace view landing_funnel_summary
    with (security_invoker = true) as
select
    (select count(distinct visitor_id) from landing_vote)     as voters,
    (select count(*) from landing_vote)                       as raw_votes,
    (select count(*) from landing_preorder)                   as preorders;

revoke all on landing_vote_summary, landing_preorder_summary, landing_funnel_summary
    from anon, authenticated;

commit;
