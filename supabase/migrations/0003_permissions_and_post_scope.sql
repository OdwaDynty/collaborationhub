-- 0003_permissions_and_post_scope.sql
-- Adds explicit per-person permission flags and post scoping.
-- Regular employees (all flags false) can view/comment but not author
-- posts or announcements.

alter table profiles
  add column can_post_org_wide boolean not null default false,
  add column can_post_department boolean not null default false,
  add column can_create_announcements boolean not null default false;

alter table posts
  add column scope text not null default 'department'
    check (scope in ('organization', 'department')),
  add column department_id uuid references departments(id);

-- A department-scoped post must specify which department;
-- an organization-scoped post must not.
alter table posts
  add constraint posts_scope_department_consistency check (
    (scope = 'department' and department_id is not null) or
    (scope = 'organization' and department_id is null)
  );

create index idx_posts_department on posts(department_id);

-- Mirrors `comments` but for announcements — kept as a separate table
-- so announcements can be changed/removed without touching post comments.
create table announcement_comments (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references announcements(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create index idx_announcement_comments_announcement on announcement_comments(announcement_id);