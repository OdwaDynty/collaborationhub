# Demo Setup Guide

Run through this before a demo to have a populated, realistic-looking
app rather than an empty one. Safe to re-run — most steps just add data.

## 1. Create demo accounts

Sign up (via `/login`) with 3-4 accounts covering different permission
levels, so you can show contrast live:

| Email | Purpose |
|---|---|
| you@zibuke.com | Full permissions (org-wide post, announcements) |
| manager@zibuke.com | Department-only posting |
| employee@zibuke.com | No posting permission — view/comment only |

## 2. Set up org structure (run once in SQL Editor)

```sql
insert into business_units (name, country_id)
select 'Technology & Digital', id from countries where code = 'ZA'
returning id;
-- copy the id, then:

insert into departments (name, business_unit_id) values
  ('Engineering', '<business_unit id>'),
  ('People Systems', '<business_unit id>'),
  ('Marketing', '<business_unit id>');
```

## 3. Grant permissions and assign departments

For each demo account, look up their UID in Authentication → Users, then:

```sql
-- Full-permission account
update profiles set
  job_title = 'Engineering Manager',
  department_id = (select id from departments where name = 'Engineering'),
  can_post_org_wide = true,
  can_post_department = true,
  can_create_announcements = true
where id = '<uid>';

-- Department-only poster
update profiles set
  job_title = 'Marketing Lead',
  department_id = (select id from departments where name = 'Marketing'),
  can_post_department = true
where id = '<uid>';

-- No permissions (regular employee)
update profiles set
  job_title = 'Software Engineer',
  department_id = (select id from departments where name = 'Engineering')
where id = '<uid>';
```

## 4. Seed birthdays (for the birthdays page)

```sql
update profiles set birthday = current_date
where id = '<uid of one account>'; -- shows under "Today"

update profiles set birthday = current_date + interval '7 days'
where id = '<uid of another account>'; -- shows under "Upcoming"
```

## 5. Create a few posts and announcements

Easiest done live, through the actual UI as each demo account — this
also naturally demonstrates the permission-gating as part of your walk-
through, rather than pre-seeding everything invisibly.

Suggested talking order:
1. Sign in as the full-permission account → show "New Post" form → post
   org-wide → show it appears
2. Sign in as the no-permission account → show the form is **absent** →
   comment on the existing post instead
3. Publish an announcement as the full-permission account → comment on
   it as the no-permission account

## 6. Reset between demos (optional)

To clear test posts without touching users/org structure:
```sql
delete from comments;
delete from announcement_comments;
delete from posts;
delete from announcements;
```
