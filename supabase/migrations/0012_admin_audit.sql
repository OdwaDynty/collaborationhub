-- 0012_admin_audit.sql
-- Admin + Audit (Phase 9). Admins get scoped capabilities only — employee
-- management, role/permission changes, channel archiving, and an audit
-- log. Deliberately does NOT expose direct message or channel message
-- content to admins; the audit log stores only metadata about actions,
-- never message bodies.

alter table profiles
  add column is_active boolean not null default true;

-- Extend the existing self-protection trigger: non-admins still can't
-- touch privileged columns on their own row (unchanged), but admins can
-- now change them on ANY row — this is what makes admin management
-- actually usable from the app instead of only via the Supabase dashboard.
create or replace function protect_privileged_profile_columns()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_is_admin boolean;
begin
  if auth.role() = 'authenticated' then
    select (role = 'admin') into v_is_admin
    from public.profiles where id = auth.uid();

    if not coalesce(v_is_admin, false) then
      new.role := old.role;
      new.can_post_org_wide := old.can_post_org_wide;
      new.can_post_department := old.can_post_department;
      new.can_create_announcements := old.can_create_announcements;
      new.can_create_channels := old.can_create_channels;
      new.is_active := old.is_active;
    end if;
  end if;
  return new;
end;
$$;

-- Lets an admin update ANY profile row. Layers with the existing
-- profiles_update_own policy (self can always update own row) — RLS
-- policies for the same command are OR'd together.
create policy "profiles_update_by_admin"
  on profiles for update to authenticated
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (true);

-- Channels currently have no update policy at all (archiving was never
-- wired up) — this adds it, admin-only.
create policy "channels_update_by_admin"
  on channels for update to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  )
  with check (true);

-- ── Audit log ──

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_events_created_at on audit_events(created_at desc);

alter table audit_events enable row level security;

-- Admin-only read. No insert/update/delete policy for authenticated
-- users at all — the only way a row gets in is via the security definer
-- trigger functions below, which bypass RLS as the table owner.
create policy "audit_events_select_admin"
  on audit_events for select to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Logs role/permission/active-status changes. Runs AFTER the protection
-- trigger above, so a blocked attempt from a non-admin never shows up
-- here — only changes that actually took effect get logged.
create function audit_profile_privileged_change()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     or new.can_post_org_wide is distinct from old.can_post_org_wide
     or new.can_post_department is distinct from old.can_post_department
     or new.can_create_announcements is distinct from old.can_create_announcements
     or new.can_create_channels is distinct from old.can_create_channels
     or new.is_active is distinct from old.is_active
  then
    insert into audit_events (actor_id, action, target_type, target_id, metadata)
    values (
      auth.uid(),
      case
        when new.is_active is distinct from old.is_active and new.is_active = false then 'employee_deactivated'
        when new.is_active is distinct from old.is_active and new.is_active = true then 'employee_activated'
        when new.role is distinct from old.role then 'role_changed'
        else 'permission_changed'
      end,
      'profile',
      new.id,
      jsonb_build_object(
        'role', jsonb_build_object('old', old.role, 'new', new.role),
        'can_post_org_wide', jsonb_build_object('old', old.can_post_org_wide, 'new', new.can_post_org_wide),
        'can_post_department', jsonb_build_object('old', old.can_post_department, 'new', new.can_post_department),
        'can_create_announcements', jsonb_build_object('old', old.can_create_announcements, 'new', new.can_create_announcements),
        'can_create_channels', jsonb_build_object('old', old.can_create_channels, 'new', new.can_create_channels),
        'is_active', jsonb_build_object('old', old.is_active, 'new', new.is_active)
      )
    );
  end if;
  return new;
end;
$$;

create trigger audit_profile_privileged_change_trigger
  after update on profiles
  for each row
  execute function audit_profile_privileged_change();

-- Logs channel creation and archiving.
create function audit_channel_events()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into audit_events (actor_id, action, target_type, target_id, metadata)
    values (new.created_by, 'channel_created', 'channel', new.id,
      jsonb_build_object('name', new.name, 'visibility', new.visibility));
  elsif tg_op = 'UPDATE' and new.is_archived is distinct from old.is_archived and new.is_archived then
    insert into audit_events (actor_id, action, target_type, target_id, metadata)
    values (auth.uid(), 'channel_archived', 'channel', new.id,
      jsonb_build_object('name', new.name));
  end if;
  return new;
end;
$$;

create trigger audit_channel_events_trigger
  after insert or update on channels
  for each row
  execute function audit_channel_events();

-- Logs employee creation — extends the existing signup trigger rather
-- than adding a second one, so there's still exactly one place that
-- reacts to auth.users inserts.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email)
  );

  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (new.id, 'employee_created', 'profile', new.id, jsonb_build_object('email', new.email));

  return new;
end;
$$;

-- Logs logins. Fires on every new session (Supabase creates one per
-- sign-in). If this specific trigger errors with a permissions message,
-- tell me — there's a fallback using auth.users.last_sign_in_at instead.
create function audit_login()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (new.user_id, 'login', 'session', new.id, jsonb_build_object('session_id', new.id));
  return new;
end;
$$;

create trigger on_auth_session_created
  after insert on auth.sessions
  for each row
  execute function audit_login();