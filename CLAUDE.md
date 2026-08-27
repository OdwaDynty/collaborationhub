# Zibuke Africa Internal Collaboration Hub

@AGENTS.md

## Project Purpose

This project is an internal collaboration hub for Zibuke Africa.

The long-term goal is to provide a central communication and collaboration
platform for employees across departments, business units and countries.

The platform is intended to reduce dependence on internal email.

The future platform may eventually support approximately 300,000 employees.

The current objective is a small, polished and fully functional demo.

---

# Core Development Principles

The following principles take priority throughout development:

1. Maintainability
2. Clean code structure
3. Feature isolation
4. Intuitive user experience
5. Ease of use
6. Security
7. Type safety
8. Testability
9. Responsive design
10. Deployment portability
11. Future scalability without premature complexity

---

# Scope

The 7-day demo must remain intentionally small.

The primary demo experience is a central company hub containing:

- Employee feed
- Company announcements
- Employee posts
- Comments
- Employee directory
- Departments
- Business units
- Countries
- Birthday information
- Basic roles and permissions

Do not add large enterprise features unless specifically required.

Potential future features include:

- Direct messaging
- Team spaces
- Events
- Employee recognition
- Notifications
- File sharing
- Tasks
- Search
- HR integrations
- Enterprise authentication
- Analytics
- Mobile applications

Do not implement future features during the demo unless they become necessary.

---

# Architecture

Use a modular monolithic architecture.

The initial application should remain one Next.js application.

Do not introduce:

- Microservices
- Kubernetes
- Message queues
- Complex distributed systems
- Unnecessary infrastructure

unless a real requirement appears.

Features should be isolated and loosely coupled.

Removing one feature must not unnecessarily break unrelated features.

Example:

Removing birthdays must not break posts.

Removing comments must not break posts.

Removing announcements must not break the employee feed.

---

# Separation of Responsibilities

Keep the following responsibilities separate where practical:

- UI components
- Business logic
- Database access
- Validation
- Authentication
- Authorization
- Shared utilities
- Types

Avoid placing database queries and complex business logic directly inside large UI components.

Prefer:

UI
→ Feature logic/server action
→ Validation
→ Authorization
→ Data access
→ Database

---

# TypeScript

Use TypeScript strictly.

Avoid `any`.

If `any` is genuinely required, document why.

Prefer explicit domain types.

Use meaningful names.

Prefer:

- createAnnouncement()
- getCompanyFeed()
- getUpcomingBirthdays()
- canPublishAnnouncement()

Avoid vague names such as:

- processData()
- getData()
- handleThing()
- doStuff()

---

# Database

Use PostgreSQL through Supabase.

Use proper:

- Primary keys
- Foreign keys
- Constraints
- Indexes
- Timestamps
- Relationships

Do not store relational information in unnecessary JSON fields.

Do not retrieve large datasets unnecessarily.

Use pagination for potentially large datasets.

Do not design the demo around 300,000 records.

Instead, make sensible choices that allow the system to grow later.

---

# Security

Never trust permissions supplied by the browser.

Authorization must be enforced server-side.

Never expose:

- Supabase service-role keys
- API secrets
- Authentication secrets
- Private credentials

Never commit `.env.local`.

Use environment variables.

Validate important user input on the server.

Use appropriate Supabase Row Level Security where applicable.

---

# UI/UX

The application must be:

- Simple
- Clean
- Professional
- Beautiful
- Intuitive
- Responsive
- Accessible

The user should understand the main interface without training.

Avoid unnecessary:

- Animations
- Colours
- Menus
- Cards
- Modals
- Decorative elements

Do not sacrifice usability for visual effects.

---

# Responsive Requirements

The application must work on:

- Desktop browsers
- Laptop browsers
- Tablet browsers
- Android mobile browsers

Use responsive web design.

Do not build a separate mobile application during the demo.

---

# Error Handling

The failure of one feature should not unnecessarily destroy the entire application.

Use:

- Loading states
- Empty states
- Error states
- Useful user-facing messages
- Appropriate error boundaries where needed

Do not expose raw database or server errors to users.

---

# AI Development Workflow

Before implementing a significant feature:

1. Inspect the existing code.
2. Inspect the relevant Next.js documentation in node_modules when required.
3. Identify existing reusable components and utilities.
4. Explain the proposed implementation.
5. Identify files that will change.
6. Implement the smallest sensible solution.
7. Run TypeScript checks.
8. Run ESLint.
9. Run relevant tests.
10. Review the implementation for maintainability.
11. Refactor where necessary.
12. Explain important architectural decisions.

Do not rewrite the entire project to solve a small problem.

Do not create duplicate functionality.

Do not introduce dependencies without a clear reason.

Do not change the architecture without explaining why.

---

# Requirements Assumptions

If a requirement is unknown:

1. Make a sensible assumption.
2. Document the assumption in docs/decisions.md.
3. Continue development.

Do not repeatedly stop development waiting for clarification.

The demo has a limited development period.

---

# Maintainability Test

Before considering a feature complete, ask:

"If another developer had to modify or remove this feature six months from now,
could they identify its code, dependencies and database requirements without
having to understand the entire application?"

If the answer is no, improve the structure.

---

# Scalability

The future platform may support approximately 300,000 employees.

The demo does not need enterprise-scale infrastructure.

However:

- Use pagination.
- Use appropriate database indexes.
- Avoid unnecessary database queries.
- Avoid loading large datasets into the browser.
- Keep features modular.
- Keep business logic separate from presentation.
- Avoid hard-coded limits where unnecessary.

Do not prematurely introduce complex scaling infrastructure.

---

# Deployment

The application must be capable of running:

- Locally in VS Code
- On Vercel
- On Render
- On Zibuke Africa infrastructure

Avoid unnecessary dependencies on one hosting provider.

Keep environment configuration separate from source code.

The application should be portable between hosting environments.

---

# Documentation

Maintain:

docs/
├── requirements.md
├── architecture.md
├── database.md
├── security.md
├── deployment.md
├── decisions.md
└── roadmap.md

Document important decisions and non-obvious behaviour.

Do not add meaningless comments explaining obvious code.

Comments should explain WHY something is done when the reason is not obvious.

---

# Testing

Prioritise tests for:

- Authentication
- Authorization
- Post creation
- Post permissions
- Announcement permissions
- Comments
- Feed behaviour
- Important business rules

Test the important user journeys.

Do not waste the demo period trying to test every visual detail.

---

# Git

Use meaningful commits.

Examples:

feat: add employee authentication

feat: add company feed

feat: add employee posts

feat: add announcements

fix: prevent unauthorised announcement editing

refactor: separate feed data access

test: add announcement permission tests

docs: update deployment instructions

Avoid meaningless commit messages such as:

update

changes

stuff

final

---

# Important Rule

Do not confuse more functionality with better software.

For the demo:

Build fewer features, but build them properly.

The final application should demonstrate:

- Good architecture
- Good UX
- Clean code
- Proper security
- Maintainability
- Responsive design
- Reliable deployment
- Clear documentation

The developer must understand every significant part of the code and be able to explain the architectural decisions.