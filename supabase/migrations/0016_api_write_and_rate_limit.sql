-- 0016_api_write_and_rate_limit.sql
-- API write access (Phase 10). Fixes a real gap first: api_keys had no
-- RLS at all, meaning the public anon key could potentially read key
-- hashes directly via Supabase's REST API. Enabling RLS with zero
-- policies makes it default-deny for anon/authenticated — the service
-- role (used by all API routes) bypasses RLS entirely regardless, so
-- nothing about how the API routes work changes.
alter table api_keys enable row level security;

-- An API key isn't a person, but every row it creates (posts.author_id,
-- announcements.author_id) requires a real profiles.id via foreign key.
-- owner_profile_id is that indirection — like a company card assigned
-- to a named employee. can_write is separate from authentication
-- (validateApiKey already proves WHO the key is) — this is authorization
-- (WHAT it's allowed to do), off by default so existing read-only keys
-- stay read-only.
alter table api_keys
  add column owner_profile_id uuid references profiles(id),
  add column can_write boolean not null default false,
  add column rate_limit_window_start timestamptz,
  add column rate_limit_count integer not null default 0;

-- Atomic rate limit check: a single SQL function with a row lock
-- (FOR UPDATE), not a read-then-write from application code — two
-- concurrent requests reading the same count in JS could both pass
-- when only one should. The lock makes this safe under real concurrency.
create function check_and_increment_rate_limit(
  p_key_id uuid,
  p_limit int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
  v_window_start timestamptz;
  v_count int;
begin
  select rate_limit_window_start, rate_limit_count into v_window_start, v_count
  from public.api_keys where id = p_key_id
  for update;

  if v_window_start is null or now() - v_window_start > (p_window_seconds || ' seconds')::interval then
    update public.api_keys
    set rate_limit_window_start = now(), rate_limit_count = 1
    where id = p_key_id;
    return true;
  elsif v_count < p_limit then
    update public.api_keys
    set rate_limit_count = rate_limit_count + 1
    where id = p_key_id;
    return true;
  else
    return false;
  end if;
end;
$$;