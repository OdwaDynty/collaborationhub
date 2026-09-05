-- 0026_archived_channel_restrictions.sql
-- Closes the gap found after building channel archiving: archiving
-- previously only removed a channel from listings — it did NOT stop
-- new messages or files from being added to it, and there was no way
-- back except raw SQL. This migration:
--   1. Blocks new channel messages and files on an archived channel,
--      enforced at the database level (the real backstop, not just a
--      friendly app-side check).
--   2. Fixes the audit trigger to also log when a channel is
--      unarchived, not just when it's archived — otherwise reversing
--      an archive would be a silent, untracked action.

-- Small security-definer helper, mirroring is_channel_member's shape —
-- lets an RLS policy ask "is this channel archived?" without needing
-- its own broad SELECT access to the channels table.
create function is_channel_archived(p_channel_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select coalesce((select is_archived from public.channels where id = p_channel_id), false)
$$;

drop policy "channel_messages_insert_if_member" on channel_messages;
create policy "channel_messages_insert_if_member"
  on channel_messages for insert to authenticated
  with check (
    author_id = auth.uid()
    and is_channel_member(channel_id, auth.uid())
    and not is_channel_archived(channel_id)
  );

drop policy "files_insert_if_member" on files;
create policy "files_insert_if_member"
  on files for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and is_channel_member(channel_id, auth.uid())
    and not is_channel_archived(channel_id)
  );

-- Updated to log BOTH directions of the is_archived flip, not just
-- true. Uses `create or replace` since the trigger itself
-- (audit_channel_events_trigger, already `after insert or update`)
-- doesn't need to change — only the function it calls does.
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
  elsif tg_op = 'UPDATE' and new.is_archived is distinct from old.is_archived then
    insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
    values (
      auth.uid(),
      case when new.is_archived then 'channel_archived' else 'channel_unarchived' end,
      'channel',
      new.id,
      jsonb_build_object('name', new.name)
    );
  end if;
  return new;
end;
$$;