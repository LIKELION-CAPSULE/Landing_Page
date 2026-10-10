-- Add the Joseon poster after the migrations already applied on main.
-- Keep baekdojun as a historical ID so existing votes remain valid.
-- Apply this file in Supabase SQL Editor before publishing the new poster.

begin;

alter table public.landing_vote
    drop constraint if exists landing_vote_room_id_check;
alter table public.landing_vote
    add constraint landing_vote_room_id_check
    check (room_id in ('smile', 'lantern', 'top', 'fenesis', 'cat',
                       'baekdojun', 'jurassic', 'iljin', 'lab', 'joseon'));

create or replace view public.landing_vote_summary
    with (security_invoker = true) as
with latest as (
    select distinct on (visitor_id) room_id, visitor_id
    from public.landing_vote
    order by visitor_id, created_at desc
)
select
    r.room_id,
    count(l.visitor_id) as votes,
    round(100.0 * count(l.visitor_id)
          / nullif((select count(*) from latest), 0), 1) as share_pct,
    (select count(*) from public.landing_vote v where v.room_id = r.room_id) as raw_votes
from unnest(array['smile', 'lantern', 'top', 'fenesis', 'cat',
                  'baekdojun', 'jurassic', 'iljin', 'lab', 'joseon']) as r(room_id)
left join latest l on l.room_id = r.room_id
group by r.room_id
order by votes desc, r.room_id;

revoke all on public.landing_vote_summary from anon, authenticated;

commit;
