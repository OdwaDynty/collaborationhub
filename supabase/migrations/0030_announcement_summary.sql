-- 0030_announcement_summary.sql
-- Auto-summarized announcements. Nullable on purpose: generated once
-- at publish time (not on every view, which is what keeps this
-- cheap), and if AI generation ever fails, the announcement still
-- publishes successfully with summary left NULL rather than blocking
-- a core admin workflow on an external API call.
alter table announcements add column summary text;