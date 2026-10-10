-- 유입 정보(utm·referrer)를 투표·사전예약 행에 저장 (2026-10-11)
--
-- 왜: 유입 경로가 Mixpanel 에만 있어서 "이메일을 남긴 사람이 어디서 왔나" 를 DB 에서 볼 수 없었다.
-- 첫 진입 때 브라우저가 utm 과 referrer 를 잡아(src/lib/api.ts captureAttribution) 행마다 같이 보낸다.
-- 전부 nullable — 직접 입력·메신저 유입은 값이 없다 (Mixpanel 의 "(not set)" 과 같은 뜻).

begin;

alter table landing_vote
    add column if not exists utm_source   text check (char_length(utm_source) <= 100),
    add column if not exists utm_medium   text check (char_length(utm_medium) <= 100),
    add column if not exists utm_campaign text check (char_length(utm_campaign) <= 100),
    add column if not exists referrer     text check (char_length(referrer) <= 100),
    add column if not exists landing_path text check (char_length(landing_path) <= 100);

alter table landing_preorder
    add column if not exists utm_source   text check (char_length(utm_source) <= 100),
    add column if not exists utm_medium   text check (char_length(utm_medium) <= 100),
    add column if not exists utm_campaign text check (char_length(utm_campaign) <= 100),
    add column if not exists referrer     text check (char_length(referrer) <= 100),
    add column if not exists landing_path text check (char_length(landing_path) <= 100);

-- Q. 어디서 온 사람이 투표하고, 예약까지 가나
--    source = utm_source 가 있으면 그것, 없으면 referrer 도메인, 둘 다 없으면 '(직접/메신저)'
create or replace view landing_source_summary
    with (security_invoker = true) as
with v as (
    select distinct on (visitor_id) visitor_id,
           coalesce(utm_source, referrer, '(직접/메신저)') as source
    from landing_vote
    order by visitor_id, created_at desc
), p as (
    select preorder_id, coalesce(utm_source, referrer, '(직접/메신저)') as source
    from landing_preorder
)
select
    s.source,
    (select count(*) from v where v.source = s.source) as voters,
    (select count(*) from p where p.source = s.source) as preorders,
    round(100.0 * (select count(*) from p where p.source = s.source)
          / nullif((select count(*) from v where v.source = s.source), 0), 1) as preorder_rate_pct
from (select source from v union select source from p) s
order by preorders desc, voters desc;

revoke all on landing_source_summary from anon, authenticated;

commit;
