import type { AdminEmployee, Department } from "@/types/admin";
import { EmployeeRow } from "./employee-row";

export function EmployeeTable({
  employees,
  departments,
}: {
  employees: AdminEmployee[];
  departments: Department[];
}) {
  if (employees.length === 0) {
    return <p className="text-sm text-zinc-500">No employees found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded border">
      <table className="w-full text-left">
        <thead className="border-b bg-zinc-50 text-xs text-zinc-500 dark:bg-zinc-900">
          <tr>
            <th className="p-2">Employee</th>
            <th className="p-2">Job title</th>
            <th className="p-2">Department</th>
            <th className="p-2">Birthday</th>
            <th className="p-2">Role</th>
            <th className="p-2">Org-wide</th>
            <th className="p-2">Dept</th>
            <th className="p-2">Announce</th>
            <th className="p-2">Channels</th>
            <th className="p-2 text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {employees.map((e) => (
            <EmployeeRow key={e.id} employee={e} departments={departments} />
          ))}
        </tbody>
      </table>
    </div>
  );
}