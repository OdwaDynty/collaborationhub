import Link from "next/link";
import { CalendarPlus, CalendarX, Cake, Speaker } from "lucide-react";
import { getUpcomingCalendarEvents } from "@/features/calendar/queries";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { events, error } = await getUpcomingCalendarEvents();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-6">
      <h1 className="font-heading text-lg font-semibold text-ink">Calendar</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && events.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-hairline bg-white py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-teal/10">
            <CalendarX className="h-5 w-5 text-brand-teal-ink" />
          </div>
          <p className="text-sm font-medium text-ink">Nothing scheduled</p>
          <p className="max-w-xs text-sm text-ink/50">
            Announcements with a date, and birthdays in the next 30 days,
            will show up here.
          </p>
        </div>
      )}

      {!error && events.length > 0 && (
        <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-white">
          {events.map((event) => (
            <li key={event.id} className="flex items-center gap-3 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-teal/10">
                {event.type === "birthday" ? (
                  <Cake className="h-4 w-4 text-brand-teal-ink" />
                ) : (
                  <Speaker className="h-4 w-4 text-brand-teal-ink" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-sm font-semibold text-ink">
                  {event.title}
                </p>
                <p className="text-sm text-ink/50">
                  {new Date(event.date).toLocaleString(undefined, {
                    month: "long",
                    day: "numeric",
                    ...(event.type === "announcement"
                      ? { hour: "2-digit", minute: "2-digit" }
                      : {}),
                  })}
                </p>
              </div>
              {event.icsUrl && (
                <Link
                  href={event.icsUrl}
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-teal/10 px-3 py-1.5 text-xs font-medium text-brand-teal-ink transition-colors hover:bg-brand-teal/20"
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  Add
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}