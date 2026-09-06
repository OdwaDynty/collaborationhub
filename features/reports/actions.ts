"use server";

import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai/openai";
import { getWeekStart } from "@/lib/dates";
import {
  getReportingStats,
  getEngagementByLevel as getEngagementByLevelQuery,
  getHeadcountByCountry,
} from "./queries";

type ActionResult = { error: string | null };

/**
 * Thin server action wrapper around queries.ts's getEngagementByLevel.
 * This existed BEFORE the digest feature — LevelTabs (a client
 * component) needs to call this after the page has already loaded
 * (when someone clicks a Department/Business Unit/Country tab), and
 * only a "use server" function can be called directly from a client
 * component that way.
 */
export async function getEngagementByLevel(
  level: "department" | "businessUnit" | "country"
) {
  return getEngagementByLevelQuery(level);
}

/**
 * Generates (or returns the already-cached) weekly insight digest.
 * Admin-only — enforced by the insight_digests_admin_insert RLS
 * policy, since this action runs as the requesting user, not a
 * service role.
 *
 * Cost control: checks for an existing row for this week FIRST. If
 * one exists, returns immediately without ever calling the AI API
 * again — this is what makes "click it as many times as you want"
 * safe from a cost perspective.
 */
export async function generateWeeklyDigest(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const weekStart = getWeekStart();

  const { data: existing } = await supabase
    .from("insight_digests")
    .select("id")
    .eq("week_start", weekStart)
    .maybeSingle();

  if (existing) {
    return { error: null };
  }

  const { stats } = await getReportingStats();
  const { engagement: byDepartment } = await getEngagementByLevelQuery("department");
  const { headcount } = await getHeadcountByCountry();

  if (!stats) {
    return { error: "Unable to gather this week's statistics." };
  }

  const statsSummary = [
    `Active employees: ${stats.activeEmployees}`,
    `Posts this month: ${stats.postsThisMonth}`,
    `Active channels: ${stats.activeChannels}`,
    `Posts by department: ${byDepartment.map((d) => `${d.label} (${d.postCount})`).join(", ")}`,
    `Headcount by country: ${headcount.map((h) => `${h.countryName} (${h.employeeCount})`).join(", ")}`,
  ].join("\n");

  const { text, error: aiError } = await generateText({
    systemPrompt:
      "You write short, plain-English weekly insight summaries for a People Systems Manager overseeing a distributed workforce across multiple countries and departments. Write 3-4 sentences, factual and concrete. Point out anything notable — a department with unusually high or low activity, an interesting headcount distribution. Never invent a number that wasn't given to you.",
    userPrompt: `Here is this week's data:\n${statsSummary}\n\nWrite the summary now.`,
    maxTokens: 180,
  });

  if (aiError || !text) {
    return { error: aiError ?? "Unable to generate this week's insight." };
  }

  const { error: insertError } = await supabase.from("insight_digests").insert({
    week_start: weekStart,
    content: text,
  });

  if (insertError) {
    console.error("generateWeeklyDigest insert error:", insertError.message);
    return { error: "Unable to save this week's insight." };
  }

  return { error: null };
}