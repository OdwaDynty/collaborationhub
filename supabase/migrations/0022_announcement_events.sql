-- 0022_announcement_events.sql
-- Calendar Sync, Phase 2 (internal half — no external services yet).
-- Adds an optional event date/time to announcements. When set, the
-- announcement can generate a downloadable .ics calendar file that
-- works with any calendar app (Google, Outlook, Apple) — no OAuth,
-- no external API, no stored credentials. A live two-way Google
-- Calendar sync was considered and deliberately deferred (see project
-- notes) because it needs an external Google Cloud project and
-- ongoing responsibility for storing refresh tokens — this .ics
-- approach gets nearly the same user-facing result without that risk.

alter table announcements
  add column event_at timestamptz;
-- Nullable on purpose: most announcements are just news, not events.
-- A NULL event_at means "this announcement has no calendar event."