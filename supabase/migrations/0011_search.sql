-- 0011_search.sql
-- Global search (Phase 8). Full-text search via generated tsvector columns
-- + GIN indexes, not ilike — ilike can't use an index with a leading
-- wildcard, so it would table-scan on every search as the org grows.
-- Search respects each table's existing RLS; no new visibility rules.

alter table profiles
  add column search_vector tsvector
    generated always as (
      to_tsvector('english', coalesce(full_name, '') || ' ' || coalesce(job_title, ''))
    ) stored;
create index idx_profiles_search on profiles using gin(search_vector);

alter table posts
  add column search_vector tsvector
    generated always as (to_tsvector('english', coalesce(content, ''))) stored;
create index idx_posts_search on posts using gin(search_vector);

alter table announcements
  add column search_vector tsvector
    generated always as (
      to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
    ) stored;
create index idx_announcements_search on announcements using gin(search_vector);

alter table channels
  add column search_vector tsvector
    generated always as (
      to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
    ) stored;
create index idx_channels_search on channels using gin(search_vector);