import { getReportingStats, getEngagementByDepartment } from "@/features/reports/queries";
import { isCurrentUserAdmin } from "@/features/admin/queries";
import { EngagementBarChart } from "@/features/reports/bar-chart";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
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

  const { stats, error: statsError } = await getReportingStats();
  const { engagement, error: engagementError } = await getEngagementByDepartment();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-lg font-semibold text-ink">Reports</h1>

      {statsError && <p className="text-sm text-red-600">{statsError}</p>}

      {stats && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-hairline bg-white p-4">
            <p className="text-xs text-ink/40">Active employees</p>
            <p className="font-heading text-2xl font-semibold text-brand-teal-ink">
              {stats.activeEmployees}
            </p>
          </div>
          <div className="rounded-xl border border-hairline bg-white p-4">
            <p className="text-xs text-ink/40">Posts this month</p>
            <p className="font-heading text-2xl font-semibold text-brand-teal-ink">
              {stats.postsThisMonth}
            </p>
          </div>
          <div className="rounded-xl border border-hairline bg-white p-4">
            <p className="text-xs text-ink/40">Active channels</p>
            <p className="font-heading text-2xl font-semibold text-brand-teal-ink">
              {stats.activeChannels}
            </p>
          </div>
        </div>
      )}

      {engagementError && <p className="text-sm text-red-600">{engagementError}</p>}

      {engagement.length > 0 && (
        <div className="rounded-xl border-[1.5px] border-brand-teal bg-white p-5">
          <p className="mb-4 text-sm text-ink/60">Posts this month by department</p>
          <EngagementBarChart engagement={engagement} />
        </div>
      )}
    </div>
  );
}