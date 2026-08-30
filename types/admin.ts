export type AdminEmployee = {
  id: string;
  full_name: string;
  job_title: string | null;
  department_id: string | null;
  birthday: string | null;
  role: "employee" | "admin";
};

export type Department = {
  id: string;
  name: string;
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