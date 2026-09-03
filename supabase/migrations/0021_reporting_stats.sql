-- 0021_reporting_stats.sql
-- Reporting. These aggregate functions deliberately bypass RLS (security
-- definer) so counts are organization-wide and accurate — a plain count
-- query would otherwise be silently limited by each table's own RLS
-- (e.g. department-scoped posts only visible to that department). Each
-- function enforces its own admin check internally, not just relying on
-- the page hiding the link from non-admins.

create function get_reporting_stats()
returns table (
  active_employees bigint,
  posts_this_month bigint,
  active_channels bigint
)
language plpgsql
security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Admin access required.';
  end if;

  return query
  select
    (select count(*) from public.profiles where is_active) as active_employees,
    (select count(*) from public.posts where created_at >= date_trunc('month', now())) as posts_this_month,
    (select count(*) from public.channels where not is_archived) as active_channels;
end;
$$;

create function get_engagement_by_department()
returns table (
  department_name text,
  post_count bigint
)
language plpgsql
security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Admin access required.';
  end if;

  return query
  select d.name, count(p.id)
  from public.departments d
  left join public.profiles pr on pr.department_id = d.id
  left join public.posts p
    on p.author_id = pr.id and p.created_at >= date_trunc('month', now())
  group by d.name
  order by count(p.id) desc
  limit 6;
end;
$$;