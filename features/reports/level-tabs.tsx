"use client";

import { useState, useTransition } from "react";
import { EngagementBarChart } from "./bar-chart";
import { getEngagementByLevel } from "./actions";
import type { EngagementBreakdown } from "@/types/reports";

const LEVELS = [
  { key: "department" as const, label: "Department" },
  { key: "businessUnit" as const, label: "Business Unit" },
  { key: "country" as const, label: "Country" },
];

/**
 * Lets the manager switch which level the engagement chart is grouped
 * by, without leaving the page. Starts already loaded with the
 * department-level data (fetched on the server, passed in as a prop),
 * so the very first view has zero loading delay — switching to
 * Business Unit or Country then fetches fresh data client-side.
 */
export function LevelTabs({ initial }: { initial: EngagementBreakdown[] }) {
  const [level, setLevel] = useState<"department" | "businessUnit" | "country">("department");
  const [engagement, setEngagement] = useState<EngagementBreakdown[]>(initial);
  const [isPending, startTransition] = useTransition();

  function handleSwitch(newLevel: typeof level) {
    setLevel(newLevel);
    startTransition(async () => {
      const result = await getEngagementByLevel(newLevel);
      setEngagement(result.engagement);
    });
  }

  return (
    <div className="rounded-xl border-[1.5px] border-brand-teal bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink/60">Posts this month by</p>
        <div className="flex gap-1 rounded-lg bg-canvas p-1">
          {LEVELS.map((l) => (
            <button
              key={l.key}
              onClick={() => handleSwitch(l.key)}
              disabled={isPending}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                level === l.key
                  ? "bg-brand-teal text-white"
                  : "text-ink/50 hover:text-ink"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <EngagementBarChart engagement={engagement} />
    </div>
  );
}