"use server";

import { getEngagementByLevel as getEngagementByLevelQuery } from "./queries";

// Thin server action wrapper — the LevelTabs client component needs to
// call this after the page has already loaded (when someone clicks a
// tab), and only "use server" files can be called directly from client
// components like that.
export async function getEngagementByLevel(
  level: "department" | "businessUnit" | "country"
) {
  return getEngagementByLevelQuery(level);
}