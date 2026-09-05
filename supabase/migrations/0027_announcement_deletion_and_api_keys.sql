-- 0027_announcement_deletion_and_api_keys.sql
-- Item 4 of the delete-feature audit: announcement deletion
-- (admin-only, since these are official communications — any admin
-- should be able to take one down, not just its original author) and
-- an actual UI for revoking an API key (previously only possible via
-- raw SQL).

-- ── Announcement deletion ──
-- Soft delete (is_deleted flag), matching posts/comments/announcement_
-- comments from the earlier delete-your-own-content work — an
-- announcement can have comments attached, so a hard delete would
-- force cascading those away too.
alter table announcements add column is_deleted boolean not null default false;

-- Mirrors channels_update_by_admin exactly — any admin, not just the
-- original author, since these are official company communications.
create policy "announcements_update_by_admin"
  on announcements for update to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  )
  with check (true);

-- Mirrors audit_channel_events()'s shape — a trigger, not an inline
-- insert inside the app action, so this stays consistent with how
-- channel archiving is audited, and can't be bypassed by any future
-- code path that updates this table directly.
create function audit_announcement_events()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.is_deleted is distinct from old.is_deleted and new.is_deleted then
    insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
    values (auth.uid(), 'announcement_deleted', 'announcement', new.id,
      jsonb_build_object('title', new.title));
  end if;
  return new;
end;
$$;

create trigger audit_announcement_events_trigger
  after update on announcements
  for each row
  execute function audit_announcement_events();

-- ── API key revocation ──
-- api_keys has NO RLS policies granting authenticated users anything
-- at all (deliberately default-deny — see migration 0016), unlike
-- profiles/channels which already have admin-specific policies. Rather
-- than opening that up with a broad policy, these two narrow
-- SECURITY DEFINER functions do the one specific job each is named
-- for, with their own internal admin check — the same pattern used
-- for Reports and the earlier soft-delete functions. Critically,
-- get_api_keys_for_admin() never returns key_hash — there is no
-- legitimate reason an admin UI ever needs to see it, hashed or not.
create function get_api_keys_for_admin()
returns table (
  id uuid,
  name text,
  owner_name text,
  can_write boolean,
  created_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz
)
language plpgsql
security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Admin access required.';
  end if;

  return query
  select k.id, k.name, p.full_name, k.can_write, k.created_at, k.last_used_at, k.revoked_at
  from public.api_keys k
  left join public.profiles p on p.id = k.owner_profile_id
  order by k.created_at desc;
end;
$$;

create function revoke_api_key(p_key_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Admin access required.';
  end if;

  update public.api_keys
  set revoked_at = now()
  where id = p_key_id and revoked_at is null;

  if not found then
    raise exception 'Key not found, or already revoked.';
  end if;

  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (auth.uid(), 'api_key_revoked', 'api_key', p_key_id, '{}'::jsonb);
end;
$$;