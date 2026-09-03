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
    return <p className="text-sm text-ink/50">No employees found.</p>;
  }

  return (
    <div className="space-y-2">
      {employees.map((e) => (
        <EmployeeRow key={e.id} employee={e} departments={departments} />
      ))}
    </div>
  );
}