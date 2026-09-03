import {
  getEmployeesForAdmin,
  getDepartmentsForAdmin,
  getAuditEvents,
  isCurrentUserAdmin,
} from "@/features/admin/queries";
import { EmployeeTable } from "@/features/admin/employee-table";
import { AuditLog } from "@/features/admin/audit-log";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/home");
  }

  const { employees, error: employeesError } = await getEmployeesForAdmin();
  const { departments } = await getDepartmentsForAdmin();
  const { events, error: eventsError } = await getAuditEvents();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-6">
      <section>
        <h1 className="mb-3 font-heading text-lg font-semibold text-ink">Employees</h1>
        {employeesError && <p className="text-sm text-red-600">{employeesError}</p>}
        {!employeesError && (
          <EmployeeTable employees={employees} departments={departments} />
        )}
      </section>

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Audit log</h2>
        {eventsError && <p className="text-sm text-red-600">{eventsError}</p>}
        {!eventsError && <AuditLog events={events} />}
      </section>
    </div>
  );
}