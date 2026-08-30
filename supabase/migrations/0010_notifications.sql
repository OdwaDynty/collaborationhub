-- 0010_notifications.sql
-- Notifications (Phase 6). Deliberately NOT fan-out for broadcast content —
-- see docs/decisions.md entry below. Only direct messages (fanout=1) get
-- real stored rows; channels and announcements use derived "last read"
-- comparisons instead, so this stays cheap at any org size.

-- ── Derived unread state (no notification rows, ever) ──

alter table channel_members
  add column last_read_at timestamptz;

create policy "channel_members_update_own"
  on channel_members for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

alter table profiles
  add column last_read_announcements_at timestamptz;

-- ── Stored notifications: direct messages only (fanout=1, cheap) ──

create table notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('direct_message')),
  conversation_id uuid references conversations(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index idx_notifications_profile_unread
  on notifications(profile_id, created_at desc) where read_at is null;

alter table notifications enable row level security;

create policy "notifications_select_own"
  on notifications for select to authenticated
  using (profile_id = auth.uid());

create policy "notifications_update_own"
  on notifications for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Trigger: creates a notification for the RECIPIENT only (never the
-- sender) whenever a direct message is sent. This is the one place
-- notifications couples to another feature — everything else (channels,
-- announcements) stays fully decoupled.
create function notify_on_direct_message()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_recipient_id uuid;
begin
  select case
    when participant_one_id = new.sender_id then participant_two_id
    else participant_one_id
  end into v_recipient_id
  from public.conversations
  where id = new.conversation_id;

  insert into public.notifications (profile_id, type, conversation_id, content)
  values (v_recipient_id, 'direct_message', new.conversation_id, left(new.content, 200));

  return new;
end;
$$;

create trigger notify_on_direct_message_trigger
  after insert on direct_messages
  for each row
  execute function notify_on_direct_message();