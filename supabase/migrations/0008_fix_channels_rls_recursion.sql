-- 0008_fix_channels_rls_recursion.sql
-- channels_select_visible and channel_members_select_if_channel_visible
-- each queried the other table, so Postgres detected infinite recursion
-- and rejected every select on both tables. Fix: security definer helper
-- functions that bypass RLS internally (same pattern as
-- get_upcoming_birthdays), so membership checks don't re-trigger policies.

create function is_channel_member(p_channel_id uuid, p_profile_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.channel_members
    where channel_id = p_channel_id and profile_id = p_profile_id
  )
$$;

create function is_channel_public(p_channel_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.channels
    where id = p_channel_id and visibility = 'public'
  )
$$;

-- ── channels ──
drop policy "channels_select_visible" on channels;
create policy "channels_select_visible"
  on channels for select to authenticated
  using (
    visibility = 'public'
    or is_channel_member(id, auth.uid())
  );

-- ── channel_members ──
drop policy "channel_members_select_if_channel_visible" on channel_members;
create policy "channel_members_select_if_channel_visible"
  on channel_members for select to authenticated
  using (
    is_channel_public(channel_id)
    or is_channel_member(channel_id, auth.uid())
  );

drop policy "channel_members_insert_self_public" on channel_members;
create policy "channel_members_insert_self_public"
  on channel_members for insert to authenticated
  with check (
    profile_id = auth.uid()
    and is_channel_public(channel_id)
  );

-- ── channel_messages ──
drop policy "channel_messages_select_if_member" on channel_messages;
create policy "channel_messages_select_if_member"
  on channel_messages for select to authenticated
  using (is_channel_member(channel_id, auth.uid()));

drop policy "channel_messages_insert_if_member" on channel_messages;
create policy "channel_messages_insert_if_member"
  on channel_messages for insert to authenticated
  with check (
    author_id = auth.uid()
    and is_channel_member(channel_id, auth.uid())
  );