"use client";

import { useEffect, useState } from "react";
import type { EngagementBreakdown } from "@/types/reports";

const CHART_HEIGHT = 140;

/**
 * Renders the animated engagement bar chart.
 *
 * MOBILE FIX: the outer chart row now scrolls horizontally
 * (overflow-x-auto) with a guaranteed minimum width, and each bar's
 * column has min-w-0 added. Here's why both were needed:
 *
 * By default, a flex item's min-width is "auto", not 0 — meaning it
 * will never shrink smaller than its own content's natural size,
 * even inside a flex-1 column. That's exactly why `truncate` on the
 * label text wasn't actually truncating on narrow screens: the
 * column was never being told it was ALLOWED to shrink below its
 * label's full width in the first place. With six bars all refusing
 * to compress on a ~375px-wide phone in portrait, the whole row
 * became wider than its card, and spilled visually past the card's
 * rounded border — landscape just happened to be wide enough that
 * this never showed up.
 *
 * min-w-0 fixes the root cause (columns can now actually shrink).
 * The min-w-[420px] + overflow-x-auto wrapper is an extra safety net
 * for very narrow phones or a very large number of bars (e.g. all 6
 * countries) — instead of squishing bar labels into illegible
 * slivers, the chart becomes horizontally scrollable WITHIN the
 * card, so the card's own border always stays fully intact and
 * correct no matter how narrow the screen is.
 */
export function EngagementBarChart({ engagement }: { engagement: EngagementBreakdown[] }) {
  const [animated, setAnimated] = useState(false);
  const maxCount = Math.max(1, ...engagement.map((e) => e.postCount));

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="overflow-x-auto">
      <div
        className="flex min-w-[420px] items-end gap-5"
        style={{ height: CHART_HEIGHT }}
      >
        {engagement.map((e) => {
          const isTop = e.postCount === maxCount && maxCount > 0;
          const targetHeight = Math.max(6, (e.postCount / maxCount) * (CHART_HEIGHT - 28));
          return (
            <div
              key={e.label}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
            >
              <span className="text-xs font-medium text-ink/60">{e.postCount}</span>
              <div
                className={`w-full rounded-t-md transition-[height] duration-700 ease-out ${
                  isTop ? "bg-brand-teal" : "bg-brand-teal/30"
                }`}
                style={{ height: animated ? `${targetHeight}px` : "0px" }}
                title={`${e.postCount} posts`}
              />
              <span className="w-full truncate text-center text-[11px] text-ink/50">
                {e.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}