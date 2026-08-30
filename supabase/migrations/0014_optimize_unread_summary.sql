-- 0014_optimize_unread_summary.sql
-- Fixes an N+1 query bug in getUnreadSummary(): it was looping over
-- every channel membership with a separate awaited query per channel,
-- run on every page load via app/(app)/layout.tsx. This collapses that
-- into one query via a JOIN + LATERAL, so the unread-channels check is
-- a single round-trip regardless of how many channels the user is in.

create function get_channels_with_unread(p_profile_id uuid)
returns table (channel_id uuid, name text)
language sql
stable
security definer set search_path = ''
as $$
  select c.id, c.name
  from public.channel_members cm
  join public.channels c on c.id = cm.channel_id
  join lateral (
    select max(created_at) as latest_at
    from public.channel_messages
    where channel_id = cm.channel_id and not is_deleted
  ) latest on true
  where cm.profile_id = p_profile_id
    and latest.latest_at is not null
    and (cm.last_read_at is null or latest.latest_at > cm.last_read_at)
$$;