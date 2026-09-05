-- 0024_file_deletion.sql
-- File deletion (Item 1 of the "no delete anywhere" audit). A file can
-- be removed by the person who uploaded it, OR by an admin of the
-- channel it belongs to — mirroring the same "owner or channel admin"
-- pattern already used elsewhere in this app (e.g. channel management).
--
-- Deletion is a real, hard delete here (not a soft is_deleted flag like
-- messages use) — a shared file is meant to actually be gone when
-- removed, not just hidden, which matters for the POPIA-aware data
-- handling already established in other parts of this platform.

-- Lets the files table itself be deleted by the right people. This is
-- the primary, authoritative permission check.
create policy "files_delete_if_owner_or_channel_admin"
  on files for delete to authenticated
  using (
    uploaded_by = auth.uid()
    or exists (
      select 1 from channel_members
      where channel_members.channel_id = files.channel_id
        and channel_members.profile_id = auth.uid()
        and channel_members.role = 'admin'
    )
  );

-- Storage (the actual file bytes in the "channel-files" bucket) is a
-- SEPARATE subsystem from the database, with its own RLS — deleting the
-- database row above does NOT automatically delete the stored file.
-- This helper function lets the storage policy below ask "does a files
-- row exist for this exact storage path, where THIS specific person is
-- allowed to delete it?" — reusing the exact same owner-or-admin logic
-- as the policy above, rather than duplicating it or (worse) allowing
-- any channel member to delete storage objects directly.
create function can_delete_file(p_storage_path text, p_profile_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.files f
    where f.storage_path = p_storage_path
      and (
        f.uploaded_by = p_profile_id
        or exists (
          select 1 from public.channel_members cm
          where cm.channel_id = f.channel_id
            and cm.profile_id = p_profile_id
            and cm.role = 'admin'
        )
      )
  )
$$;

create policy "channel_files_storage_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'channel-files'
    and can_delete_file(name, auth.uid())
  );