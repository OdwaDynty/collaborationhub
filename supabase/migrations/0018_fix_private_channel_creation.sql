-- 0018_fix_private_channel_creation.sql
-- Creating a private channel failed with a generic error even though the
-- insert itself succeeded — the immediate select-back of the new row was
-- blocked by RLS, since the creator isn't added as a member until a
-- separate, later insert. Fix: a creator can always see a channel they
-- created, regardless of membership timing.

drop policy "channels_select_visible" on channels;
create policy "channels_select_visible"
  on channels for select to authenticated
  using (
    visibility = 'public'
    or is_channel_member(id, auth.uid())
    or created_by = auth.uid()
  );