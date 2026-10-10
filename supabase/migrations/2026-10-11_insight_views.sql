-- 사업·기획 질문에 바로 답하는 집계 뷰 (2026-10-11)
--
-- "어떤 캐릭터를 원하나", "어떻게 공부하나", "누가 오나", "어느 룸이 실제 예약으로 이어지나".
-- 원본은 landing_preorder 한 테이블이고, 여기서는 그걸 질문 단위로 잘라 둔다.
-- 전부 security_invoker — anon 은 못 읽고 대시보드(SQL Editor)에서만 본다.

begin;

-- Q. 어떤 관계·성격·세계관의 캐릭터를 원하나  (survey_picks jsonb 를 풀어서 센다)
--    share_pct 분모 = 수요조사에 하나라도 답한 사전예약자 수
create or replace view landing_survey_summary
    with (security_invoker = true) as
with answered as (
    select preorder_id, survey_picks
    from landing_preorder
    where survey_picks <> '{}'::jsonb
), picks as (
    select a.preorder_id, g.key as group_id, l.value as label
    from answered a
    cross join lateral jsonb_each(a.survey_picks) as g(key, value)
    cross join lateral jsonb_array_elements_text(g.value) as l(value)
)
select
    group_id,
    label,
    count(distinct preorder_id) as picks,
    round(100.0 * count(distinct preorder_id)
          / nullif((select count(*) from answered), 0), 1) as share_pct
from picks
group by group_id, label
order by group_id, picks desc, label;

-- Q. 지금 어떻게 공부하나  (복수 선택이라 합계가 사전예약자 수를 넘는다)
create or replace view landing_habit_summary
    with (security_invoker = true) as
select
    h.habit,
    count(*) as preorders,
    round(100.0 * count(*) / nullif((select count(*) from landing_preorder), 0), 1) as share_pct
from landing_preorder p
cross join lateral unnest(p.habits) as h(habit)
group by h.habit
order by preorders desc, h.habit;

-- Q. 누가 오나 (나이대). null = 선택 안 함
create or replace view landing_age_summary
    with (security_invoker = true) as
select
    coalesce(age, '(미선택)') as age,
    count(*) as preorders,
    round(100.0 * count(*) / nullif((select count(*) from landing_preorder), 0), 1) as share_pct
from landing_preorder
group by age
order by preorders desc;

-- Q. 어느 룸이 "투표"를 넘어 "이메일을 남기는" 데까지 가나
--    votes = 유효표(landing_vote_summary), preorders = 그 룸을 고른 채 사전예약한 수
--    preorder_rate_pct = preorders / votes. 투표는 많은데 예약이 적은 룸은 관심은 끌지만 확신은 못 주는 룸이다.
create or replace view landing_room_funnel_summary
    with (security_invoker = true) as
select
    v.room_id,
    v.votes,
    count(p.preorder_id) as preorders,
    round(100.0 * count(p.preorder_id) / nullif(v.votes, 0), 1) as preorder_rate_pct
from landing_vote_summary v
left join landing_preorder p on p.voted_room_id = v.room_id
group by v.room_id, v.votes
order by preorders desc, v.votes desc;

-- Q. 자유 서술 모아 보기 (원하는 캐릭터, 기타 공부 방식). 기획 회의용.
create or replace view landing_free_text
    with (security_invoker = true) as
select created_at, 'character_wish' as kind, survey_wish as text, voted_room_id
from landing_preorder where survey_wish is not null
union all
select created_at, 'habit_other', habit_other, voted_room_id
from landing_preorder where habit_other is not null
order by created_at desc;

revoke all on landing_survey_summary, landing_habit_summary, landing_age_summary,
              landing_room_funnel_summary, landing_free_text
    from anon, authenticated;

commit;
