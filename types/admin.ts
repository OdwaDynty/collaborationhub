export type AdminEmployee = {
  id: string;
  full_name: string;
  job_title: string | null;
  department_id: string | null;
  birthday: string | null;
  role: "employee" | "admin";
  is_active: boolean;
  can_post_org_wide: boolean;
  can_post_department: boolean;
  can_create_announcements: boolean;
  can_create_channels: boolean;
};

export type Department = {
  id: string;
  name: string;
  business_unit_name: string;
  country_name: string;
};

export type AuditEvent = {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor: { full_name: string } | null;
};

export type ApiKey = {
  id: string;
  name: string;
  owner_name: string | null;
  can_write: boolean;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};