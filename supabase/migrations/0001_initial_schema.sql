-- 0001_initial_schema.sql
-- Core entities for the Zibuke Africa Internal Collaboration Hub demo.
-- RLS is intentionally NOT enabled here — see docs/decisions.md.
-- It will be added in Phase 3 alongside auth/role logic.

create table countries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique
);

create table business_units (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_id uuid not null references countries(id),
  created_at timestamptz not null default now()
);
create index idx_business_units_country on business_units(country_id);

create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_unit_id uuid not null references business_units(id),
  created_at timestamptz not null default now()
);
create index idx_departments_business_unit on departments(business_unit_id);

-- Extends Supabase's auth.users with app-specific profile data.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  job_title text,
  department_id uuid references departments(id),
  avatar_url text,
  birthday date,
  role text not null default 'employee' check (role in ('employee', 'admin')),
  created_at timestamptz not null default now()
);
create index idx_profiles_department on profiles(department_id);

create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create index idx_posts_created_at on posts(created_at desc);

create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create index idx_comments_post on comments(post_id);

create table announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);
create index idx_announcements_created_at on announcements(created_at desc);