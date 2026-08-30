-- 0007_channels.sql
-- Structured collaboration spaces (Phase 3). Isolated from feed/announcements —
-- removing this feature doesn't touch posts, comments, or announcements.

alter table profiles
  add column can_create_channels boolean not null default true;

-- Extend the existing trigger so users can't grant themselves channel
-- creation via a raw API call, same protection as the other flags.
create or replace function protect_privileged_profile_columns()
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
    new.can_create_channels := old.can_create_channels;
  end if;
  return new;
end;
$$;

create table channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  is_archived boolean not null default false
);
create index idx_channels_visibility on channels(visibility) where not is_archived;

create table channel_members (
  channel_id uuid not null references channels(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'admin')),
  joined_at timestamptz not null default now(),
  primary key (channel_id, profile_id)
);
create index idx_channel_members_profile on channel_members(profile_id);

create table channel_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references channels(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null check (char_length(content) > 0),
  parent_message_id uuid references channel_messages(id) on delete cascade,
  created_at timestamptz not null default now(),
  is_deleted boolean not null default false
);
create index idx_channel_messages_channel on channel_messages(channel_id, created_at desc);

-- ── RLS ──
alter table channels enable row level security;
alter table channel_members enable row level security;
alter table channel_messages enable row level security;

create policy "channels_select_visible"
  on channels for select to authenticated
  using (
    visibility = 'public'
    or exists (
      select 1 from channel_members
      where channel_members.channel_id = channels.id
        and channel_members.profile_id = auth.uid()
    )
  );

create policy "channels_insert_permission_checked"
  on channels for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from profiles where id = auth.uid() and can_create_channels
    )
  );

create policy "channel_members_select_if_channel_visible"
  on channel_members for select to authenticated
  using (
    exists (
      select 1 from channels
      where channels.id = channel_members.channel_id
        and (
          channels.visibility = 'public'
          or exists (
            select 1 from channel_members cm2
            where cm2.channel_id = channels.id and cm2.profile_id = auth.uid()
          )
        )
    )
  );

create policy "channel_members_insert_self_public"
  on channel_members for insert to authenticated
  with check (
    profile_id = auth.uid()
    and exists (
      select 1 from channels
      where channels.id = channel_id and channels.visibility = 'public'
    )
  );

create policy "channel_members_delete_self"
  on channel_members for delete to authenticated
  using (profile_id = auth.uid());

create policy "channel_messages_select_if_member"
  on channel_messages for select to authenticated
  using (
    exists (
      select 1 from channel_members
      where channel_members.channel_id = channel_messages.channel_id
        and channel_members.profile_id = auth.uid()
    )
  );

create policy "channel_messages_insert_if_member"
  on channel_messages for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from channel_members
      where channel_members.channel_id = channel_messages.channel_id
        and channel_members.profile_id = auth.uid()
    )
  );