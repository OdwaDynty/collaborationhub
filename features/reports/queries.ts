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

/**
 * Fetches the cached digest for a specific week, if one has already
 * been generated. Returns null (not an error) if nothing exists yet
 * for that week — that's the normal, expected state before anyone's
 * clicked "Generate" this week.
 */
export async function getDigestForWeek(weekStart: string): Promise<{
  digest: { content: string; generatedAt: string } | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("insight_digests")
    .select("content, generated_at")
    .eq("week_start", weekStart)
    .maybeSingle();

  if (error) {
    console.error("getDigestForWeek error:", error.message);
    return { digest: null, error: "Unable to load this week's insight." };
  }

  if (!data) {
    return { digest: null, error: null };
  }

  return { digest: { content: data.content, generatedAt: data.generated_at }, error: null };
}