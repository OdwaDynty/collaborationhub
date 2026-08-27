## RLS deferred to Phase 3
Tables were created in Phase 2 without Row Level Security enabled.
Enabling RLS with no policies would lock every table down completely
(default-deny), which isn't useful until roles/auth exist. RLS and
policies (employee vs admin permissions) are added together in
Phase 3 so they can be tested against real authenticated sessions.