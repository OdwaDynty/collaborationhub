import { createClient } from "@/lib/supabase/server";
import type { ReportingStats, EngagementBreakdown, CountryHeadcount } from "@/types/reports";

type StatsRow = {
  active_employees: number;
  posts_this_month: number;
  active_channels: number;
};

export async function getReportingStats(): Promise<{
  stats: ReportingStats | null;
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_reporting_stats");

  if (error || !data || data.length === 0) {
    console.error("getReportingStats error:", error?.message);
    return { stats: null, error: "Unable to load stats." };
  }

  const row = data[0] as StatsRow;
  return {
    stats: {
      activeEmployees: row.active_employees,
      postsThisMonth: row.posts_this_month,
      activeChannels: row.active_channels,
    },
    error: null,
  };
}

// One shared function that calls whichever RPC matches the requested
// level, and normalizes all three into the same EngagementBreakdown
// shape — this is what lets the page use a single reusable chart
// component instead of three copies of nearly identical code.
export async function getEngagementByLevel(
  level: "department" | "businessUnit" | "country"
): Promise<{ engagement: EngagementBreakdown[]; error: string | null }> {
  const supabase = await createClient();

  const rpcName =
    level === "department"
      ? "get_engagement_by_department"
      : level === "businessUnit"
        ? "get_engagement_by_business_unit"
        : "get_engagement_by_country";

  const { data, error } = await supabase.rpc(rpcName);

  if (error) {
    console.error(`getEngagementByLevel (${level}) error:`, error.message);
    return { engagement: [], error: "Unable to load engagement data." };
  }

  // Each RPC returns a slightly different column name for the "label"
  // (department_name / business_unit_name / country_name) — this picks
  // whichever one is actually present on each row and normalizes it.
  const engagement = ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    label: (row.department_name ?? row.business_unit_name ?? row.country_name) as string,
    postCount: Number(row.post_count),
  }));

  return { engagement, error: null };
}

export async function getHeadcountByCountry(): Promise<{
  headcount: CountryHeadcount[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_headcount_by_country");

  if (error) {
    console.error("getHeadcountByCountry error:", error.message);
    return { headcount: [], error: "Unable to load headcount data." };
  }

  type Row = { country_name: string; employee_count: number };
  return {
    headcount: ((data ?? []) as Row[]).map((row) => ({
      countryName: row.country_name,
      employeeCount: Number(row.employee_count),
    })),
    error: null,
  };
}