# Testing Checklist — Critical Flows

Run through this before any demo, deployment, or hand-off. Focused on
business-critical behavior per the project brief — not exhaustive UI
testing, just the paths that matter: auth, authorization, and
permission enforcement.

## Authentication

- [ ] Sign up with a new email → redirected to `/feed`, profile
      auto-created via the `handle_new_user` trigger
- [ ] Sign in with correct credentials → succeeds
- [ ] Sign in with wrong password → clear error shown (not a raw
      Postgres/Supabase error)
- [ ] Visiting any `/(app)` route while signed out → redirected to
      `/login`
- [ ] Visiting `/login` while already signed in → redirected away
- [ ] Sign out → redirected to `/login`; subsequent visits to
      `/feed` redirect back to `/login`

## Authorization — Posting

- [ ] Account with `can_post_org_wide = true` → sees "New Post"
      form, can publish an organization-wide post
- [ ] Account with no posting flags set → **no post form visible at
      all** on `/feed`
- [ ] (Optional, stronger check) As a no-permission user, attempt a
      direct Supabase insert via browser dev tools console — confirm
      RLS rejects it even bypassing the UI entirely

## Authorization — Announcements

- [ ] Account with `can_create_announcements = true` → sees the
      create form, can publish
- [ ] Account without that flag → no create form, but **can** still
      comment on existing announcements

## Comments (unrestricted)

- [ ] Any authenticated account can comment on any post or
      announcement they can see, regardless of posting permissions

## Visibility scoping

- [ ] Organization-wide posts are visible to all authenticated users
- [ ] Department-scoped posts are visible only to users in that
      department (requires a second department + test user to fully
      verify)

## Directory & Birthdays

- [ ] Search on `/people` filters correctly by name
- [ ] `/birthdays` shows the correct people under "Today" and
      "Upcoming (next 30 days)", based on month/day only — not birth
      year

## Regression check (after any refactor)

- [ ] `npm run lint` passes with zero errors
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] Re-run the Authentication + Authorization sections above — these
      are the most likely to silently break from an unrelated change