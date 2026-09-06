-- 0029_insight_digests.sql
-- Weekly Insight Digest: turns Reports' existing numbers into a short,
-- plain-English summary for the People Systems Manager. Deliberately
-- ON-DEMAND (a button an admin clicks), not an automatic background
-- job — this project has no existing job queue/cron infrastructure,
-- and on-demand generation naturally caches by week, so clicking it
-- ten times in the same week still only costs one real AI call.

create table insight_digests (
  id uuid primary key default gen_random_uuid(),
  -- The Monday of the week this digest covers. UNIQUE means a second
  -- generation attempt for the same week can never create a duplicate
  -- row — see how the action below handles this.
  week_start date not null unique,
  content text not null,
  generated_at timestamptz not null default now()
);

alter table insight_digests enable row level security;

-- Admin-only in both directions — this is a management-facing view of
-- organization-wide data, same sensitivity level as Reports itself.
create policy "insight_digests_admin_select"
  on insight_digests for select to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "insight_digests_admin_insert"
  on insight_digests for insert to authenticated
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));