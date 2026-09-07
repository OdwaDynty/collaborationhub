import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCalendarEventsForMonth } from "@/features/calendar/queries";
import { CalendarGrid } from "@/features/calendar/calendar-grid";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const now = new Date();
  const params = await searchParams;
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month) || now.getMonth() + 1; // 1-12

  const { events, error } = await getCalendarEventsForMonth(year, month);

  // Wraps correctly across year boundaries (December -> January, and
  // January -> December going the other way).
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-lg font-semibold text-ink">
          {MONTH_NAMES[month - 1]} {year}
        </h1>
        <div className="flex items-center gap-1">
          <Link
            href={`/calendar?year=${prevYear}&month=${prevMonth}`}
            aria-label="Previous month"
            className="rounded-lg p-1.5 text-ink/50 transition-colors hover:bg-canvas hover:text-brand-teal"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href="/calendar"
            className="rounded-lg border border-hairline px-3 py-1 text-xs font-medium text-ink/60 transition-colors hover:bg-canvas"
          >
            Today
          </Link>
          <Link
            href={`/calendar?year=${nextYear}&month=${nextMonth}`}
            aria-label="Next month"
            className="rounded-lg p-1.5 text-ink/50 transition-colors hover:bg-canvas hover:text-brand-teal"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && <CalendarGrid year={year} month={month} events={events} />}
    </div>
  );
}