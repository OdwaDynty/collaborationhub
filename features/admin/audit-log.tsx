import type { AuditEvent } from "@/types/admin";

const ACTION_LABELS: Record<string, string> = {
  login: "Logged in",
  employee_created: "Employee created",
  employee_activated: "Employee activated",
  employee_deactivated: "Employee deactivated",
  role_changed: "Role changed",
  permission_changed: "Permission changed",
  channel_created: "Channel created",
  channel_archived: "Channel archived",
  channel_unarchived: "Channel unarchived",
  announcement_deleted: "Announcement deleted",
  api_key_revoked: "API key revoked",
};

export function AuditLog({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-ink/50">No audit events yet.</p>;
  }

  return (
    <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-white">
      {events.map((event) => (
        <li key={event.id} className="p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-heading font-semibold text-ink">
              {ACTION_LABELS[event.action] ?? event.action}
            </span>
            <time className="text-xs text-ink/40">
              {new Date(event.created_at).toLocaleString()}
            </time>
          </div>
          <p className="text-xs text-ink/50">
            {event.actor?.full_name ?? "Unknown"} · {event.target_type}
          </p>
        </li>
      ))}
    </ul>
  );
}