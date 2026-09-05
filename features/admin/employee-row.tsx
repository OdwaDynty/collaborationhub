"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { AdminEmployee, Department } from "@/types/admin";
import {
  updateEmployeePermissions,
  updateEmployeeProfile,
  toggleEmployeeActive,
} from "./actions";

const FLAGS: { key: keyof AdminEmployee; label: string }[] = [
  { key: "can_post_org_wide", label: "Post org-wide" },
  { key: "can_post_department", label: "Post dept" },
  { key: "can_create_announcements", label: "Announcements" },
  { key: "can_create_channels", label: "Channels" },
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function EmployeeRow({
  employee,
  departments,
}: {
  employee: AdminEmployee;
  departments: Department[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState(employee.job_title ?? "");
  const [birthday, setBirthday] = useState(employee.birthday ?? "");

  // Every handler below follows the same shape: clear any old error,
  // run the update, and on success show a toast naming BOTH the person
  // and what changed — for an admin managing many employees, a generic
  // "Updated" toast wouldn't tell them which action just fired.
  function handleFlagToggle(key: keyof AdminEmployee, current: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await updateEmployeePermissions(employee.id, { [key]: !current });
      if (result.error) {
        setError(result.error);
      } else {
        const label = FLAGS.find((f) => f.key === key)?.label ?? "Permission";
        toast.success(`${label} ${!current ? "enabled" : "disabled"} for ${employee.full_name}`);
      }
    });
  }

  function handleRoleChange(role: "employee" | "admin") {
    setError(null);
    startTransition(async () => {
      const result = await updateEmployeePermissions(employee.id, { role });
      if (result.error) {
        setError(result.error);
      } else {
        toast.success(`${employee.full_name} is now ${role === "admin" ? "an Admin" : "an Employee"}`);
      }
    });
  }

  function handleActiveToggle() {
    setError(null);
    startTransition(async () => {
      const nextActive = !employee.is_active;
      const result = await toggleEmployeeActive(employee.id, nextActive);
      if (result.error) {
        setError(result.error);
      } else {
        toast.success(`${employee.full_name} ${nextActive ? "activated" : "deactivated"}`);
      }
    });
  }

  function handleJobTitleBlur() {
    if (jobTitle === (employee.job_title ?? "")) return; // nothing actually changed, skip the request entirely
    setError(null);
    startTransition(async () => {
      const result = await updateEmployeeProfile(employee.id, {
        job_title: jobTitle || null,
      });
      if (result.error) {
        setError(result.error);
      } else {
        toast.success(`Job title updated for ${employee.full_name}`);
      }
    });
  }

  function handleDepartmentChange(departmentId: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateEmployeeProfile(employee.id, {
        department_id: departmentId || null,
      });
      if (result.error) {
        setError(result.error);
      } else {
        toast.success(`Department updated for ${employee.full_name}`);
      }
    });
  }

  function handleBirthdayBlur() {
    if (birthday === (employee.birthday ?? "")) return;
    setError(null);
    startTransition(async () => {
      const result = await updateEmployeeProfile(employee.id, {
        birthday: birthday || null,
      });
      if (result.error) {
        setError(result.error);
      } else {
        toast.success(`Birthday updated for ${employee.full_name}`);
      }
    });
  }

  return (
    <div
      className={`rounded-xl border border-hairline bg-white p-4 ${
        employee.is_active ? "" : "opacity-50"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-teal/10 font-heading text-xs font-semibold text-brand-teal-ink">
            {getInitials(employee.full_name)}
          </div>
          <p className="font-heading text-sm font-semibold text-ink">{employee.full_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={employee.role}
            disabled={isPending}
            onChange={(e) => handleRoleChange(e.target.value as "employee" | "admin")}
            className="rounded-lg border border-hairline bg-canvas px-2 py-1 text-xs text-ink"
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={handleActiveToggle}
            disabled={isPending}
            className="rounded-lg border border-hairline px-3 py-1 text-xs text-ink/70 transition-colors hover:bg-canvas disabled:opacity-50"
          >
            {employee.is_active ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          onBlur={handleJobTitleBlur}
          disabled={isPending}
          placeholder="Job title"
          className="w-40 rounded-lg border border-hairline bg-canvas px-2 py-1 text-xs text-ink"
        />
        <select
          value={employee.department_id ?? ""}
          disabled={isPending}
          onChange={(e) => handleDepartmentChange(e.target.value)}
          className="w-48 rounded-lg border border-hairline bg-canvas px-2 py-1 text-xs text-ink"
        >
          <option value="">No department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} — {d.business_unit_name}, {d.country_name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          onBlur={handleBirthdayBlur}
          disabled={isPending}
          className="rounded-lg border border-hairline bg-canvas px-2 py-1 text-xs text-ink"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {FLAGS.map(({ key, label }) => {
          const checked = employee[key] as boolean;
          return (
            <button
              key={key}
              type="button"
              disabled={isPending}
              onClick={() => handleFlagToggle(key, checked)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                checked
                  ? "bg-brand-teal/10 text-brand-teal-ink"
                  : "bg-canvas text-ink/40"
              }`}
            >
              {label} {checked ? "✓" : ""}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}