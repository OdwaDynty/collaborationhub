"use client";

import { useState, useTransition } from "react";
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

  function handleFlagToggle(key: keyof AdminEmployee, current: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await updateEmployeePermissions(employee.id, { [key]: !current });
      if (result.error) setError(result.error);
    });
  }

  function handleRoleChange(role: "employee" | "admin") {
    setError(null);
    startTransition(async () => {
      const result = await updateEmployeePermissions(employee.id, { role });
      if (result.error) setError(result.error);
    });
  }

  function handleActiveToggle() {
    setError(null);
    startTransition(async () => {
      const result = await toggleEmployeeActive(employee.id, !employee.is_active);
      if (result.error) setError(result.error);
    });
  }

  function handleJobTitleBlur() {
    if (jobTitle === (employee.job_title ?? "")) return;
    setError(null);
    startTransition(async () => {
      const result = await updateEmployeeProfile(employee.id, {
        job_title: jobTitle || null,
      });
      if (result.error) setError(result.error);
    });
  }

  function handleDepartmentChange(departmentId: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateEmployeeProfile(employee.id, {
        department_id: departmentId || null,
      });
      if (result.error) setError(result.error);
    });
  }

  function handleBirthdayBlur() {
    if (birthday === (employee.birthday ?? "")) return;
    setError(null);
    startTransition(async () => {
      const result = await updateEmployeeProfile(employee.id, {
        birthday: birthday || null,
      });
      if (result.error) setError(result.error);
    });
  }

  return (
    <tr className={employee.is_active ? "" : "opacity-50"}>
      <td className="p-2 text-sm">
        <p className="font-medium">{employee.full_name}</p>
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </td>
      <td className="p-2">
        <input
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          onBlur={handleJobTitleBlur}
          disabled={isPending}
          placeholder="—"
          className="w-32 rounded border px-1 py-0.5 text-xs"
        />
      </td>
      <td className="p-2">
        <select
          value={employee.department_id ?? ""}
          disabled={isPending}
          onChange={(e) => handleDepartmentChange(e.target.value)}
          className="w-32 rounded border px-1 py-0.5 text-xs"
        >
          <option value="">—</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </td>
      <td className="p-2">
        <input
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          onBlur={handleBirthdayBlur}
          disabled={isPending}
          className="w-32 rounded border px-1 py-0.5 text-xs"
        />
      </td>
      <td className="p-2">
        <select
          value={employee.role}
          disabled={isPending}
          onChange={(e) => handleRoleChange(e.target.value as "employee" | "admin")}
          className="rounded border px-1 py-0.5 text-xs"
        >
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
      </td>
      {FLAGS.map(({ key, label }) => (
        <td key={key} className="p-2 text-center">
          <input
            type="checkbox"
            checked={employee[key] as boolean}
            disabled={isPending}
            onChange={() => handleFlagToggle(key, employee[key] as boolean)}
            aria-label={label}
          />
        </td>
      ))}
      <td className="p-2 text-center">
        <button
          onClick={handleActiveToggle}
          disabled={isPending}
          className="rounded border px-2 py-1 text-xs disabled:opacity-50"
        >
          {employee.is_active ? "Deactivate" : "Activate"}
        </button>
      </td>
    </tr>
  );
}