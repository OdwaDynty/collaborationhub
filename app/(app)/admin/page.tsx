import {
  getEmployeesForAdmin,
  getDepartmentsForAdmin,
  getAuditEvents,
  getActiveChannelsForAdmin,
  getArchivedChannelsForAdmin,
  isCurrentUserAdmin,
} from "@/features/admin/queries";
import { EmployeeTable } from "@/features/admin/employee-table";
import { AuditLog } from "@/features/admin/audit-log";
import { ChannelListAdmin } from "@/features/admin/channel-list-admin";
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
  const { channels: activeChannels, error: activeChannelsError } =
    await getActiveChannelsForAdmin();
  const { channels: archivedChannels, error: archivedChannelsError } =
    await getArchivedChannelsForAdmin();

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
        <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Channels</h2>
        {activeChannelsError && <p className="text-sm text-red-600">{activeChannelsError}</p>}
        {!activeChannelsError && (
          <ChannelListAdmin channels={activeChannels} mode="archive" />
        )}
      </section>

      {archivedChannels.length > 0 && (
        <section>
          <h2 className="mb-3 font-heading text-lg font-semibold text-ink">
            Archived channels
          </h2>
          {archivedChannelsError && (
            <p className="text-sm text-red-600">{archivedChannelsError}</p>
          )}
          {!archivedChannelsError && (
            <ChannelListAdmin channels={archivedChannels} mode="unarchive" />
          )}
        </section>
      )}

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Audit log</h2>
        {eventsError && <p className="text-sm text-red-600">{eventsError}</p>}
        {!eventsError && <AuditLog events={events} />}
      </section>
    </div>
  );
}