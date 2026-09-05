import { Globe2 } from "lucide-react";
import {
  getReportingStats,
  getEngagementByLevel,
  getHeadcountByCountry,
} from "@/features/reports/queries";
import { isCurrentUserAdmin } from "@/features/admin/queries";
import { LevelTabs } from "@/features/reports/level-tabs";
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
  // Fetches department-level data on the server for the initial view —
  // LevelTabs then handles switching to Business Unit / Country itself.
  const { engagement: departmentEngagement, error: engagementError } =
    await getEngagementByLevel("department");
  const { headcount, error: headcountError } = await getHeadcountByCountry();

  const totalHeadcount = headcount.reduce((sum, h) => sum + h.employeeCount, 0);

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

      {/* Global headcount — this is the actual "see the whole
          organization" view, distinct from engagement/activity. A
          People Systems Manager needs to know WHERE the workforce is
          before anything about how active they are. */}
      {headcountError && <p className="text-sm text-red-600">{headcountError}</p>}
      {headcount.length > 0 && (
        <div className="rounded-xl border border-hairline bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-brand-teal-ink" />
            <p className="text-sm text-ink/60">
              Headcount by country ({totalHeadcount} total)
            </p>
          </div>
          <ul className="divide-y divide-hairline">
            {headcount.map((h) => (
              <li key={h.countryName} className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-ink">{h.countryName}</span>
                <span className="text-sm text-ink/50">{h.employeeCount} employees</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {engagementError && <p className="text-sm text-red-600">{engagementError}</p>}
      {departmentEngagement.length > 0 && <LevelTabs initial={departmentEngagement} />}
    </div>
  );
}