-- 0019_birthday_wishes.sql
-- Birthday wishes/comments — a real feature, not styling. Lets colleagues
-- leave a message on someone's birthday, shown on today's celebration
-- card. Fully open visibility, matching how birthdays themselves already
-- work — anyone can see and anyone can post as themselves.

create table birthday_wishes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null check (char_length(content) > 0 and char_length(content) <= 500),
  created_at timestamptz not null default now()
);
create index idx_birthday_wishes_profile on birthday_wishes(profile_id, created_at);

alter table birthday_wishes enable row level security;

create policy "birthday_wishes_select_all"
  on birthday_wishes for select to authenticated
  using (true);

create policy "birthday_wishes_insert_own"
  on birthday_wishes for insert to authenticated
  with check (author_id = auth.uid());