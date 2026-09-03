"use client";

import { useEffect, useState } from "react";
import type { DepartmentEngagement } from "@/types/reports";

const CHART_HEIGHT = 140;

export function EngagementBarChart({ engagement }: { engagement: DepartmentEngagement[] }) {
  const [animated, setAnimated] = useState(false);
  const maxCount = Math.max(1, ...engagement.map((e) => e.postCount));

  useEffect(() => {
    // One deliberate grow-in on load, not a scattered hover effect —
    // bars animate from 0 to their real height once, right after mount.
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="flex items-end gap-5" style={{ height: CHART_HEIGHT }}>
      {engagement.map((e) => {
        const isTop = e.postCount === maxCount && maxCount > 0;
        const targetHeight = Math.max(6, (e.postCount / maxCount) * (CHART_HEIGHT - 28));
        return (
          <div key={e.departmentName} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-xs font-medium text-ink/60">{e.postCount}</span>
            <div
              className={`w-full rounded-t-md transition-[height] duration-700 ease-out ${
                isTop ? "bg-brand-teal" : "bg-brand-teal/30"
              }`}
              style={{ height: animated ? `${targetHeight}px` : "0px" }}
              title={`${e.postCount} posts`}
            />
            <span className="truncate text-[11px] text-ink/50">{e.departmentName}</span>
          </div>
        );
      })}
    </div>
  );
}