import { createClient } from "@/lib/supabase/server";
import type { ReportingStats, DepartmentEngagement } from "@/types/reports";

type StatsRow = {
  active_employees: number;
  posts_this_month: number;
  active_channels: number;
};

type EngagementRow = {
  department_name: string;
  post_count: number;
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

export async function getEngagementByDepartment(): Promise<{
  engagement: DepartmentEngagement[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_engagement_by_department");

  if (error) {
    console.error("getEngagementByDepartment error:", error.message);
    return { engagement: [], error: "Unable to load engagement data." };
  }

  return {
    engagement: ((data ?? []) as EngagementRow[]).map((row) => ({
      departmentName: row.department_name,
      postCount: row.post_count,
    })),
    error: null,
  };
}