-- 0004_rls_policies.sql
-- Enables RLS on all tables and enforces the permission model:
-- posting/announcements are gated by explicit profile flags, checked
-- server-side — never trusting client-submitted role/flag values.

-- ── Reference tables: read-only for authenticated users ──
alter table countries enable row level security;
create policy "countries_select_authenticated"
  on countries for select to authenticated using (true);

alter table business_units enable row level security;
create policy "business_units_select_authenticated"
  on business_units for select to authenticated using (true);

alter table departments enable row level security;
create policy "departments_select_authenticated"
  on departments for select to authenticated using (true);

-- ── Profiles ──
alter table profiles enable row level security;

create policy "profiles_select_all"
  on profiles for select to authenticated using (true);

create policy "profiles_update_own"
  on profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Prevents a regular authenticated user from escalating their own
-- role/permission flags, even via a direct API call bypassing the UI.
-- Dashboard/service-role updates (used for admin grants) are unaffected.
create function protect_privileged_profile_columns()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.role() = 'authenticated' then
    new.role := old.role;
    new.can_post_org_wide := old.can_post_org_wide;
    new.can_post_department := old.can_post_department;
    new.can_create_announcements := old.can_create_announcements;
  end if;
  return new;
end;
$$;

create trigger protect_privileged_profile_columns_trigger
  before update on profiles
  for each row
  execute function protect_privileged_profile_columns();

-- ── Posts ──
alter table posts enable row level security;

create policy "posts_select_visible"
  on posts for select to authenticated
  using (
    scope = 'organization'
    or department_id = (select department_id from profiles where id = auth.uid())
  );

create policy "posts_insert_permission_checked"
  on posts for insert to authenticated
  with check (
    author_id = auth.uid()
    and (
      (scope = 'organization' and exists (
        select 1 from profiles where id = auth.uid() and can_post_org_wide
      ))
      or
      (scope = 'department' and exists (
        select 1 from profiles
        where id = auth.uid()
          and can_post_department
          and department_id = posts.department_id
      ))
    )
  );

-- ── Comments (inherit visibility from their post) ──
alter table comments enable row level security;

create policy "comments_select_if_post_visible"
  on comments for select to authenticated
  using (
    exists (
      select 1 from posts
      where posts.id = comments.post_id
        and (
          posts.scope = 'organization'
          or posts.department_id = (select department_id from profiles where id = auth.uid())
        )
    )
  );

create policy "comments_insert_if_post_visible"
  on comments for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from posts
      where posts.id = comments.post_id
        and (
          posts.scope = 'organization'
          or posts.department_id = (select department_id from profiles where id = auth.uid())
        )
    )
  );

-- ── Announcements ──
alter table announcements enable row level security;

create policy "announcements_select_all"
  on announcements for select to authenticated using (true);

create policy "announcements_insert_permission_checked"
  on announcements for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from profiles where id = auth.uid() and can_create_announcements
    )
  );

-- ── Announcement comments ──
alter table announcement_comments enable row level security;

create policy "announcement_comments_select_all"
  on announcement_comments for select to authenticated using (true);

create policy "announcement_comments_insert_own"
  on announcement_comments for insert to authenticated
  with check (author_id = auth.uid());