-- 0006_api_keys.sql
-- API keys for external tool integration. Keys are hashed before
-- storage — the plaintext key is shown once at creation and never
-- stored or retrievable again, same principle as a password.

create table api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
create index idx_api_keys_key_hash on api_keys(key_hash);