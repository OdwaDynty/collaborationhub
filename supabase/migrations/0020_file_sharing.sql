-- 0020_file_sharing.sql
-- File sharing. Files attach to a channel — only members of that channel
-- can upload or view them, reusing the same is_channel_member check
-- Channels already relies on. Storage needs its own policies (a separate
-- subsystem from the database's row-level security), so a file can't be
-- reached by guessing a URL even if the database row is protected.

-- Bucket is private (not public) — every access goes through Supabase's
-- authenticated API and the policies below, never a raw public URL.
insert into storage.buckets (id, name, public)
values ('channel-files', 'channel-files', false)
on conflict (id) do nothing;

create table files (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references channels(id) on delete cascade,
  uploaded_by uuid not null references profiles(id) on delete cascade,
  file_name text not null,
  file_size bigint not null,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);
create index idx_files_channel on files(channel_id, created_at desc);

alter table files enable row level security;

create policy "files_select_if_member"
  on files for select to authenticated
  using (is_channel_member(channel_id, auth.uid()));

create policy "files_insert_if_member"
  on files for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and is_channel_member(channel_id, auth.uid())
  );

-- Storage policies. Object paths follow the convention
-- "<channel_id>/<file_id>-<filename>" — the first path segment is the
-- channel id, checked against membership the same way as the table row.
create policy "channel_files_storage_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'channel-files'
    and is_channel_member((storage.foldername(name))[1]::uuid, auth.uid())
  );

create policy "channel_files_storage_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'channel-files'
    and is_channel_member((storage.foldername(name))[1]::uuid, auth.uid())
  );