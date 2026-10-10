-- 사전예약 폼 축소 반영 + 투표 수 함수 (2026-10-11)
--
-- 프론트(#21·#22)가 사전예약에서 나이대·공부 방식·기타 서술을 뺐다. 이제 수집하는 건
-- 이메일, 동의 2개, 투표한 룸, 설문 답변뿐이다. 안 받는 컬럼을 남겨 두면 스키마가 거짓말을
-- 하므로 지운다. 테스트 행 외 데이터가 없는 상태에서 실행한다 (실데이터가 있으면 먼저 백업).
--
-- 그리고 투표 페이지의 "현재까지 N명이 투표했어요" 에 넣을 숫자를 anon 이 받을 수 있게
-- 함수 하나를 연다. 테이블 읽기는 여전히 막혀 있고, 이 함수는 정수 하나만 돌려준다.

begin;

-- ── 안 받는 컬럼과 그 집계 뷰 제거 ───────────────────────────────────────────
drop view if exists landing_habit_summary;
drop view if exists landing_age_summary;
drop view if exists landing_free_text;

alter table landing_preorder
    drop column if exists age,
    drop column if exists habits,
    drop column if exists habit_other;

-- 자유 서술은 이제 설문의 캐릭터 희망 하나뿐
create or replace view landing_free_text
    with (security_invoker = true) as
select created_at, survey_wish as text, voted_room_id
from landing_preorder
where survey_wish is not null
order by created_at desc;

revoke all on landing_free_text from anon, authenticated;

-- ── 투표한 사람 수 (방문자 기준, 재투표는 1명) ────────────────────────────────
-- security definer: 함수 소유자(postgres) 권한으로 돌아 RLS 를 넘는다. 그래서 반환값을
-- 정수 하나로 제한하고 search_path 를 고정한다.
create or replace function landing_vote_total()
returns integer
language sql
stable
security definer
set search_path = public
as $$
    select count(distinct visitor_id)::integer from landing_vote;
$$;

revoke all on function landing_vote_total() from public;
grant execute on function landing_vote_total() to anon, authenticated, service_role;

comment on function landing_vote_total() is
    '투표 페이지 "현재까지 N명" 용. anon 호출 허용 — 숫자 하나만 나간다.';

commit;
