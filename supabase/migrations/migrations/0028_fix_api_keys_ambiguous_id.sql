-- 0028_fix_api_keys_ambiguous_id.sql
-- Fixes a real bug in get_api_keys_for_admin(): its RETURNS TABLE
-- declares an output column named "id", which collides with the bare
-- "id" reference inside the function's own admin-check subquery
-- (`where id = auth.uid()`) — Postgres couldn't tell whether that
-- meant profiles.id or the function's own id output variable. Fixed
-- by explicitly qualifying it as profiles.id, removing the ambiguity
-- entirely. `create or replace` updates the existing function in
-- place — no need to drop it first.

create or replace function get_api_keys_for_admin()
returns table (
  id uuid,
  name text,
  owner_name text,
  can_write boolean,
  created_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz
)
language plpgsql
security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin') then
    raise exception 'Admin access required.';
  end if;

  return query
  select k.id, k.name, p.full_name, k.can_write, k.created_at, k.last_used_at, k.revoked_at
  from public.api_keys k
  left join public.profiles p on p.id = k.owner_profile_id
  order by k.created_at desc;
end;
$$;