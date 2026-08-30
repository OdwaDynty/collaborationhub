-- 0009_direct_messages.sql
-- One-to-one direct messaging (Phase 4). Isolated from channels/feed/
-- announcements — removing this doesn't touch any of them.

create table conversations (
  id uuid primary key default gen_random_uuid(),
  participant_one_id uuid not null references profiles(id) on delete cascade,
  participant_two_id uuid not null references profiles(id) on delete cascade,
  participant_one_last_read_at timestamptz,
  participant_two_last_read_at timestamptz,
  created_at timestamptz not null default now(),
  -- Canonical ordering enforced in the insert check below, so the same
  -- two people can never end up with two separate conversation rows.
  constraint conversations_participants_ordered check (participant_one_id < participant_two_id),
  unique (participant_one_id, participant_two_id)
);
create index idx_conversations_participant_one on conversations(participant_one_id);
create index idx_conversations_participant_two on conversations(participant_two_id);

create table direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text not null check (char_length(content) > 0),
  parent_message_id uuid references direct_messages(id) on delete cascade,
  created_at timestamptz not null default now(),
  is_deleted boolean not null default false
);
create index idx_direct_messages_conversation on direct_messages(conversation_id, created_at desc);

-- ── Helper functions (security definer, bypass RLS internally — same
--    pattern used to fix the channels recursion issue) ──

create function is_conversation_participant(p_conversation_id uuid, p_profile_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.conversations
    where id = p_conversation_id
      and (participant_one_id = p_profile_id or participant_two_id = p_profile_id)
  )
$$;

-- Marks the conversation read for the CALLING user only — this is what
-- lets us avoid a raw UPDATE policy on conversations, which couldn't
-- otherwise stop a user from marking read on the other participant's
-- behalf.
create function mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.conversations
  set
    participant_one_last_read_at =
      case when participant_one_id = auth.uid() then now() else participant_one_last_read_at end,
    participant_two_last_read_at =
      case when participant_two_id = auth.uid() then now() else participant_two_last_read_at end
  where id = p_conversation_id
    and (participant_one_id = auth.uid() or participant_two_id = auth.uid());
end;
$$;

-- ── RLS ──
alter table conversations enable row level security;
alter table direct_messages enable row level security;

create policy "conversations_select_own"
  on conversations for select to authenticated
  using (participant_one_id = auth.uid() or participant_two_id = auth.uid());

create policy "conversations_insert_own"
  on conversations for insert to authenticated
  with check (participant_one_id = auth.uid() or participant_two_id = auth.uid());

create policy "direct_messages_select_if_participant"
  on direct_messages for select to authenticated
  using (is_conversation_participant(conversation_id, auth.uid()));

create policy "direct_messages_insert_if_participant"
  on direct_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and is_conversation_participant(conversation_id, auth.uid())
  );