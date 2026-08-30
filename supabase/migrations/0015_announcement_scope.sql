-- 0015_announcement_scope.sql
-- Scoped announcement visibility (Phase 7), mirroring the same
-- organization/department scope pattern posts already use — same shape,
-- same constraint, so it's a familiar pattern rather than a new one.
-- Creation permission stays a single can_create_announcements flag
-- (unchanged) — the brief restricts announcement authorship to specific
-- People Systems employees regardless of scope, unlike posts which has
-- separate org-wide vs department flags.

alter table announcements
  add column scope text not null default 'organization'
    check (scope in ('organization', 'department')),
  add column department_id uuid references departments(id);

alter table announcements
  add constraint announcements_scope_department_consistency check (
    (scope = 'department' and department_id is not null) or
    (scope = 'organization' and department_id is null)
  );

create index idx_announcements_department on announcements(department_id);

-- Replaces the old "everyone sees everything" policy with scope-aware
-- visibility, same shape as posts_select_visible.
drop policy "announcements_select_all" on announcements;
create policy "announcements_select_visible"
  on announcements for select to authenticated
  using (
    scope = 'organization'
    or department_id = (select department_id from profiles where id = auth.uid())
  );

-- Creation stays gated by can_create_announcements only — no scope check
-- needed here since department-scoped announcements aren't required to
-- match the author's own department (People Systems may announce to
-- any department, unlike a regular employee posting to their own).