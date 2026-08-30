# API Reference (v1)

**Status:** Live and tested — both locally and in production
(`https://collaborationhub.vercel.app/api/v1/...`).

**Versioning:** the `v1` in every path is the versioning strategy — a
future breaking change would be introduced as `/api/v2/...` alongside
this, with `v1` continuing to work unchanged for existing integrations.

## Authentication
Include your API key in every request:

Authorization: Bearer <your-api-key>


## Rate limiting
Each API key is limited to 60 requests per minute. Exceeding this
returns `429` with an error message. The window resets on a rolling
per-key basis, not a shared global limit.

## Authorization (read vs. write)
Every key can read by default. Write access (`POST` routes) requires
the key to have `can_write = true` — most keys should stay read-only.

## Endpoints

### GET /api/v1/posts
Returns the 50 most recent **organization-wide** posts only —
department-scoped posts are not included (an API key has no
associated employee/department context).

### GET /api/v1/announcements
Returns the 50 most recent **organization-wide** announcements only —
department-scoped announcements are not included, for the same reason
as posts.

### POST /api/v1/announcements
Requires a key with `can_write = true`. Creates an organization-wide
announcement, authored by the key's assigned `owner_profile_id`.

Body:
```json
{ "title": "string, 1-200 chars", "content": "string, 1-5000 chars" }
```

Returns `201` with `{ "id": "<uuid>" }` on success, `403` if the key
lacks write access, `400` on validation failure.

### GET /api/v1/channels
Returns up to 50 **public** channels only (id, name, description,
visibility). Private channels are never returned — an API key has no
employee identity to check membership against.

### GET /api/v1/people
Returns up to 100 directory entries: name, job title, department.
Does not include email or any auth-related identifiers.

## Creating an API key
No management UI yet — created manually via SQL:
```sql
insert into api_keys (name, key_hash, owner_profile_id, can_write)
values (
  'Tool Name',
  encode(digest('your-plaintext-key', 'sha256'), 'hex'),
  '<profile-id-that-owns-this-key>',  -- required for write access
  false  -- set true only for keys that need POST access
);
```
Give the plaintext key to the integrating tool — it cannot be
recovered from the database afterward.

## Revoking a key
```sql
update api_keys set revoked_at = now() where name = 'Tool Name';
```

