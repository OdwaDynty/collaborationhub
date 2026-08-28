-- 0005_birthdays_function.sql
-- Returns employees with birthdays in the next N days (default 30),
-- ordered by how soon the birthday falls, ignoring birth year.
-- Isolated: only touches profiles, no dependency on posts/announcements.

create function get_upcoming_birthdays(days_ahead int default 30)
returns table (
  id uuid,
  full_name text,
  birthday date,
  days_until int
)
language sql
stable
security definer set search_path = ''
as $$
  select
    id,
    full_name,
    birthday,
    (
      case
        when (
          make_date(
            extract(year from now())::int,
            extract(month from birthday)::int,
            extract(day from birthday)::int
          ) - now()::date
        ) >= 0
        then
          make_date(
            extract(year from now())::int,
            extract(month from birthday)::int,
            extract(day from birthday)::int
          ) - now()::date
        else
          make_date(
            extract(year from now())::int + 1,
            extract(month from birthday)::int,
            extract(day from birthday)::int
          ) - now()::date
      end
    )::int as days_until
  from public.profiles
  where birthday is not null
  order by days_until
$$;