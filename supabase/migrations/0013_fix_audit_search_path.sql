-- 0013_fix_audit_search_path.sql
-- audit_profile_privileged_change, audit_channel_events, and audit_login
-- referenced "audit_events" unqualified. With search_path = '' (correct,
-- for security), there's no schema to resolve that against — needs the
-- public. prefix, same as handle_new_user and get_upcoming_birthdays
-- already do.

create or replace function audit_profile_privileged_change()
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
    insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
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

create or replace function audit_channel_events()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
    values (new.created_by, 'channel_created', 'channel', new.id,
      jsonb_build_object('name', new.name, 'visibility', new.visibility));
  elsif tg_op = 'UPDATE' and new.is_archived is distinct from old.is_archived and new.is_archived then
    insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
    values (auth.uid(), 'channel_archived', 'channel', new.id,
      jsonb_build_object('name', new.name));
  end if;
  return new;
end;
$$;

create or replace function audit_login()
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