-- 0031_company_events_and_start_date.sql
-- Phase 1 of the upgraded Calendar feature: the data model for two new
-- "things happening" sources — standalone company events (holidays,
-- all-hands, admin-created) and new-hire start dates (work
-- anniversaries). The actual month-grid calendar UI combining these
-- with birthdays and dated announcements is Phase 2, built on top of
-- this once these are confirmed working.

-- Standalone events, distinct from Announcements — not every
-- calendar-worthy date needs to also be a broadcast communication.
create table company_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);
create index idx_company_events_date on company_events(event_date);

alter table company_events enable row level security;

-- Visible to everyone — these are company-wide facts (a public
-- holiday, an all-hands), the same visibility level as birthdays.
create policy "company_events_select_all"
  on company_events for select to authenticated
  using (true);

create policy "company_events_insert_by_admin"
  on company_events for insert to authenticated
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "company_events_delete_by_admin"
  on company_events for delete to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- New column: when someone actually joined. Nullable — existing
-- employees won't have this until an admin fills it in.
alter table profiles add column start_date date;

-- Mirrors get_upcoming_birthdays()'s exact recurring-annual-date
-- pattern, but for start_date — computing "work anniversary" entries
-- the same way birthdays already work. Also returns years_at_company
-- so the UI can distinguish "James joined the team" (0 years, a
-- brand-new hire) from "James's 3rd work anniversary".
--
-- Known shared limitation with get_upcoming_birthdays(): a start_date
-- of Feb 29 would need special handling for non-leap years, which
-- neither function currently has — an accepted, pre-existing edge
-- case, not a new regression introduced here.
create function get_upcoming_work_anniversaries(days_ahead int default 30)
returns table (
  id uuid,
  full_name text,
  start_date date,
  years_at_company int,
  days_until int
)
language plpgsql
security definer set search_path = ''
as $$
begin
  return query
  with computed as (
    select
      p.id,
      p.full_name,
      p.start_date,
      case
        when make_date(
               extract(year from current_date)::int,
               extract(month from p.start_date)::int,
               extract(day from p.start_date)::int
             ) >= current_date
        then make_date(
               extract(year from current_date)::int,
               extract(month from p.start_date)::int,
               extract(day from p.start_date)::int
             )
        else make_date(
               extract(year from current_date)::int + 1,
               extract(month from p.start_date)::int,
               extract(day from p.start_date)::int
             )
      end as next_occurrence
    from public.profiles p
    where p.start_date is not null and p.is_active
  )
  select
    computed.id,
    computed.full_name,
    computed.start_date,
    (extract(year from computed.next_occurrence) - extract(year from computed.start_date))::int as years_at_company,
    (computed.next_occurrence - current_date)::int as days_until
  from computed
  where (computed.next_occurrence - current_date) <= days_ahead
  order by days_until;
end;
$$;