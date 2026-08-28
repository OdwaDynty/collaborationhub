# API Reference (v1)

**Status:** Live and tested — both locally and in production
(`https://collaborationhub.vercel.app/api/v1/...`).

Read-only endpoints for internal tool integration. Not yet available:
write operations, department-scoped data, per-key permission scopes,
rate limiting.

## Authentication
Include your API key in every request:
Authorization: Bearer <your-api-key>

## Endpoints

### GET /api/v1/posts
Returns the 50 most recent **organization-wide** posts only —
department-scoped posts are not included (an API key has no
associated employee/department context).

### GET /api/v1/announcements
Returns the 50 most recent announcements (visible to all by design).

### GET /api/v1/people
Returns up to 100 directory entries: name, job title, department.
Does not include email or any auth-related identifiers.

## Creating an API key
No management UI yet — created manually via SQL:
```sql
insert into api_keys (name, key_hash)
values ('Tool Name', encode(digest('your-plaintext-key', 'sha256'), 'hex'));
```
Give the plaintext key to the integrating tool — it cannot be
recovered from the database afterward.

## Revoking a key
```sql
update api_keys set revoked_at = now() where name = 'Tool Name';
```