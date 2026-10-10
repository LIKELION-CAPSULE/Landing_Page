-- Optional opinions now follow preorder completion. Existing preorder rows
-- remain immutable to anonymous clients; follow-up opinions are separate.
-- Apply after the previous migrations, including 2026-10-12_joseon_room.sql.

begin;

create table if not exists public.landing_survey (
    survey_id       uuid primary key default gen_random_uuid(),
    visitor_id      text not null check (char_length(visitor_id) between 8 and 64),
    room_id         text not null check (char_length(room_id) between 1 and 40),
    survey_picks    jsonb not null default '{}'::jsonb
                    check (jsonb_typeof(survey_picks) = 'object'
                           and survey_picks - array['relation', 'personality', 'world']::text[] = '{}'::jsonb
                           and not jsonb_path_exists(survey_picks, 'strict $.* ? (@.type() != "array")', '{}'::jsonb, true)
                           and not jsonb_path_exists(survey_picks, 'strict $.* ? (@.type() == "array")[*] ? (@.type() != "string")', '{}'::jsonb, true)),
    survey_wish     text check (char_length(survey_wish) <= 1000),
    privacy_consent boolean not null check (privacy_consent),
    created_at      timestamptz not null default now(),
    check (coalesce(jsonb_path_exists(survey_picks, 'strict $.* ? (@.type() == "array")[*]', '{}'::jsonb, true), false)
           or nullif(btrim(survey_wish), '') is not null)
);

create index if not exists landing_survey_visitor_idx
    on public.landing_survey (visitor_id, created_at desc, survey_id desc);

alter table public.landing_survey enable row level security;
revoke all on public.landing_survey from anon, authenticated;
grant insert on public.landing_survey to anon;
grant all on public.landing_survey to service_role;
drop policy if exists landing_survey_insert_anon on public.landing_survey;
create policy landing_survey_insert_anon on public.landing_survey
    for insert to anon with check (true);

comment on table public.landing_survey is
    'Optional character opinions after preorder. No email is sent here; visitor_id is an anonymous browser ID, not proof of reservation.';

-- Latest opinion per browser, including answers collected by the old funnel.
-- These views remain private to dashboard/service_role users.
create or replace view public.landing_survey_latest
    with (security_invoker = true) as
with submissions as (
    select visitor_id, survey_picks, survey_wish, room_id, created_at, survey_id as submission_id
    from public.landing_survey
    union all
    select visitor_id, survey_picks, survey_wish, voted_room_id, created_at, preorder_id
    from public.landing_preorder
    where survey_picks <> '{}'::jsonb or nullif(btrim(survey_wish), '') is not null
)
select distinct on (visitor_id) visitor_id, survey_picks, survey_wish, room_id, created_at
from submissions
order by visitor_id, created_at desc, submission_id desc;

create or replace view public.landing_survey_summary
    with (security_invoker = true) as
with answered as (
    select visitor_id, survey_picks
    from public.landing_survey_latest
    where survey_picks <> '{}'::jsonb
), picks as (
    select a.visitor_id, g.key as group_id, l.value as label
    from answered a
    cross join lateral jsonb_each(a.survey_picks) as g(key, value)
    cross join lateral jsonb_array_elements_text(g.value) as l(value)
)
select group_id, label, count(distinct visitor_id) as picks,
       round(100.0 * count(distinct visitor_id)
             / nullif((select count(*) from answered), 0), 1) as share_pct
from picks
group by group_id, label
order by group_id, picks desc, label;

create or replace view public.landing_free_text
    with (security_invoker = true) as
select created_at, survey_wish as text, room_id as voted_room_id
from public.landing_survey_latest
where nullif(btrim(survey_wish), '') is not null
order by created_at desc;

revoke all on public.landing_survey_latest, public.landing_survey_summary,
              public.landing_free_text from anon, authenticated;
grant select on public.landing_survey_latest, public.landing_survey_summary,
                public.landing_free_text to service_role;

commit;
