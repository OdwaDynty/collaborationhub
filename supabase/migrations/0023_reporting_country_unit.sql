-- 0023_reporting_country_unit.sql
-- Global oversight for Reports (Phase 1 of the enterprise upgrade).
-- Adds country- and business-unit-level breakdowns alongside the
-- existing department-level one, plus headcount by country — this is
-- the actual "supervise personnel across countries and units remotely"
-- promise, not just department activity.
--
-- Same pattern as the existing reporting functions: security definer
-- (deliberately bypasses RLS for accurate org-wide numbers), with the
-- admin check built into the function itself, not just the page hiding
-- the link from non-admins.

-- How many active employees are in each country. This is a headcount
-- view, not an activity view — a People Systems Manager needs to see
-- WHERE the workforce actually is before anything about engagement.
create function get_headcount_by_country()
returns table (
  country_name text,
  employee_count bigint
)
language plpgsql
security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Admin access required.';
  end if;

  return query
  select c.name, count(pr.id)
  from public.countries c
  left join public.business_units bu on bu.country_id = c.id
  left join public.departments d on d.business_unit_id = bu.id
  left join public.profiles pr on pr.department_id = d.id and pr.is_active
  group by c.name
  order by count(pr.id) desc;
end;
$$;

-- Same idea as get_engagement_by_department, but rolled up one level
-- to business unit — walks department -> business_unit the same way
-- get_headcount_by_country walks department -> business_unit -> country.
create function get_engagement_by_business_unit()
returns table (
  business_unit_name text,
  country_name text,
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
  select bu.name, c.name, count(p.id)
  from public.business_units bu
  join public.countries c on c.id = bu.country_id
  left join public.departments d on d.business_unit_id = bu.id
  left join public.profiles pr on pr.department_id = d.id
  left join public.posts p
    on p.author_id = pr.id and p.created_at >= date_trunc('month', now())
  group by bu.name, c.name
  order by count(p.id) desc
  limit 6;
end;
$$;

-- Rolled up one level further than business unit — the top-level
-- geographic view.
create function get_engagement_by_country()
returns table (
  country_name text,
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
  select c.name, count(p.id)
  from public.countries c
  left join public.business_units bu on bu.country_id = c.id
  left join public.departments d on d.business_unit_id = bu.id
  left join public.profiles pr on pr.department_id = d.id
  left join public.posts p
    on p.author_id = pr.id and p.created_at >= date_trunc('month', now())
  group by c.name
  order by count(p.id) desc
  limit 6;
end;
$$;