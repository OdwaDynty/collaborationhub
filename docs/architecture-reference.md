# Architecture Reference

Written for demonstration/assessment prep — explains what exists and why.

## Folder Structure
app/ Next.js App Router pages (routing only)
(app)/ Route group: authenticated shell + all features
feed/, announcements/, people/, birthdays/
login/ Public auth page

components/
layout/sidebar.tsx Navigation shared across all (app) routes
ui/ shadcn primitives (button, etc.)

features/ Business logic, one folder per feature
posts/, comments/, announcements/, people/, birthdays/
each contains: queries.ts (reads), actions.ts (writes),
schema.ts (Zod validation), and UI components specific to that feature

lib/
supabase/ client.ts (browser), server.ts (server),
middleware.ts (session refresh + route protection)
auth/actions.ts sign up / sign in / sign out Server Actions

types/ Shared TypeScript types per feature

supabase/migrations/ Every schema change, numbered in order (0001-0005)

docs/ This file, decisions.md, testing-checklist.md


**Why this shape:** `app/` stays thin (routing + composing feature pieces),
`features/` holds the actual logic. This is what makes features isolated —
delete `features/birthdays/` and the birthdays route breaks, but posts,
comments, and announcements are untouched.

## Architecture: Modular Monolith

One Next.js app, one Postgres database — not microservices. Chosen because:
- The team is one developer (you)
- Feature isolation is achieved at the *code* level (separate folders,
  separate tables, separate RLS policies) without the operational
  overhead of separate deployable services
- Postgres comfortably handles the read/write patterns of an internal
  tool at this scale; microservices would add complexity without solving
  a real bottleneck

## Database Design
countries → business_units → departments → profiles
profiles → posts → comments
profiles → announcements → announcement_comments


- **UUID primary keys** everywhere — safe for a system that may span
  multiple environments (dev/prod) without ID collisions
- **`comments` and `announcement_comments` are separate tables**, not one
  polymorphic table — deliberate, so removing/changing announcements
  can never break post comments, and vice versa
- **Indexes**: `posts.created_at`, `comments.post_id`,
  `announcements.created_at` — support the actual query patterns (feed
  sorted newest-first, comments looked up by post)

## Authentication

Supabase Auth (email/password). Three pieces work together:
1. **Middleware** (`lib/supabase/middleware.ts`) — refreshes the session
   token on every request, and redirects unauthenticated users away from
   protected routes
2. **Server Actions** (`lib/auth/actions.ts`) — sign up/in/out are
   privileged (they set cookies), so they run server-side
3. **Trigger** (`handle_new_user` in migration 0002) — automatically
   creates a `profiles` row whenever `auth.users` gets a new row,
   regardless of how the user was created (app, dashboard, future OAuth)

## Authorization Model

Not a simple `employee`/`admin` binary. Three explicit permission flags
on `profiles`:
- `can_post_org_wide`
- `can_post_department`
- `can_create_announcements`

**Why flags instead of roles or job-title matching:** the client
specified permission belongs to *specific people* ("People Systems
employees, not all admins, not HR"), not a title or department. Flags
are granted per-person, independent of title or org structure changes.

**Enforced at two layers, deliberately:**
1. Server Actions check the flag and return a friendly error if missing
2. **Row Level Security (RLS) policies** on the database itself reject
   the operation even if the Server Action layer is bypassed entirely —
   e.g. someone calling the Supabase API directly from browser dev tools

This is the single most important thing to be able to explain: **the
browser is never trusted to decide who can do what.**

## Main User Journeys

1. **Sign up** → trigger creates profile → land on `/feed`
2. **View feed** → RLS returns only org-wide posts + posts from the
   viewer's own department
3. **Create a post** (if permitted) → Server Action validates →
   database RLS validates again → feed revalidates
4. **Comment** (anyone) → inherits the visibility of the post/announcement
   it's attached to
5. **Search people** → paginated, indexed query joining the org hierarchy

## Scalability Decisions

- Feed and directory are **paginated** (20 rows/page), not loaded in full
- Queries use **indexes** matching actual access patterns
- Postgres RLS scales with the database, not with application server count
- No premature infrastructure (no queues, no microservices) — added only
  if a real bottleneck appears

## Error Handling

- User-facing errors are friendly strings ("Unable to load posts. Please
  try again."), never raw Postgres error messages
- Zod validates all form input before it reaches the database
- Server Actions return `{ error: string | null }` rather than throwing,
  so the UI can render errors inline without crashing

## Deployment

- Hosted on **Vercel**, connected directly to the GitHub repo — every
  push to `main` redeploys automatically
- Environment variables (`NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are set in Vercel's dashboard, never
  committed to git
- Supabase's Site URL / Redirect URLs updated to the production domain
  so auth works outside `localhost`

  