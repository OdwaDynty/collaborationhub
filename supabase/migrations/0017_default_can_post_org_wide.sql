-- 0017_default_can_post_org_wide.sql
-- Home's "anyone can post updates" promise wasn't actually true for new
-- signups — can_post_org_wide defaulted to false, silently hiding the
-- post box with no explanation. Flips the default going forward so
-- self-service signups can post immediately, matching how
-- can_create_channels already works.
--
-- Existing rows are intentionally left untouched — several test accounts
-- have this flag deliberately set to false for permission testing, and
-- retroactively flipping every existing row would overwrite that on
-- purpose-varied data rather than just fixing new signups going forward.

alter table profiles
  alter column can_post_org_wide set default true;