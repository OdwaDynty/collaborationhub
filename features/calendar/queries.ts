import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent } from "@/types/calendar";

/**
 * Builds one combined, date-sorted list of upcoming calendar events —
 * announcements that have an event_at set, plus upcoming birthdays.
 * NOTE: kept for reference but no longer used by the Calendar page
 * itself, which now uses getCalendarEventsForMonth below (a real
 * month-grid replaced the flat "upcoming" list this powered).
 */
export async function getUpcomingCalendarEvents(): Promise<{
  events: CalendarEvent[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: announcementRows, error: announcementError } = await supabase
    .from("announcements")
    .select("id, title, event_at")
    .not("event_at", "is", null)
    .gte("event_at", new Date().toISOString())
    .order("event_at", { ascending: true });

  if (announcementError) {
    console.error("getUpcomingCalendarEvents (announcements) error:", announcementError.message);
    return { events: [], error: "Unable to load calendar events." };
  }

  const { data: birthdayRows, error: birthdayError } = await supabase.rpc(
    "get_upcoming_birthdays",
    { days_ahead: 30 }
  );

  if (birthdayError) {
    console.error("getUpcomingCalendarEvents (birthdays) error:", birthdayError.message);
  }

  const announcementEvents: CalendarEvent[] = (announcementRows ?? []).map((a) => ({
    id: `announcement-${a.id}`,
    title: a.title,
    date: a.event_at as string,
    type: "announcement",
    icsUrl: `/api/calendar/announcement/${a.id}`,
  }));

  type BirthdayRow = { id: string; full_name: string; birthday: string; days_until: number };
  const birthdayEvents: CalendarEvent[] = ((birthdayRows ?? []) as BirthdayRow[]).map((b) => ({
    id: `birthday-${b.id}`,
    title: `${b.full_name}'s birthday`,
    date: b.birthday,
    type: "birthday",
    icsUrl: null,
  }));

  const events = [...announcementEvents, ...birthdayEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return { events, error: null };
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function ordinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0]}`;
}

/**
 * Fetches EVERY event across all four sources for one specific
 * calendar month — the query the new month-grid actually uses.
 *
 * Deliberately does NOT try to combine everything into a single SQL
 * function. Company Events and Announcements have real, specific
 * dates, so they're simple range-filtered queries — and Announcements
 * specifically MUST run as a normal query (not a security-definer
 * bypass) so a regular employee only ever sees announcements they're
 * actually allowed to see (org-wide or their own department), exactly
 * like everywhere else in the app. Birthdays and work anniversaries
 * are fundamentally different — they're recurring annual dates, not a
 * single fixed date — so those are fetched as plain profile rows and
 * matched against the requested month here in JavaScript, which is
 * far simpler and safer than trying to express "match month
 * component, any year" in a single SQL range filter. Matches the
 * People directory's existing precedent that basic profile fields
 * (name, birthday) are visible to every authenticated employee, not
 * scoped by department.
 */
export async function getCalendarEventsForMonth(
  year: number,
  month: number // 1-12
): Promise<{ events: CalendarEvent[]; error: string | null }> {
  const supabase = await createClient();

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonthUtc = new Date(Date.UTC(year, month, 1)); // rolls to the 1st of the following month
  const monthEndExclusive = nextMonthUtc.toISOString().split("T")[0];

  const [companyEventsResult, announcementsResult, birthdaysResult, anniversariesResult] =
    await Promise.all([
      supabase
        .from("company_events")
        .select("id, title, description, event_date")
        .gte("event_date", monthStart)
        .lt("event_date", monthEndExclusive),
      supabase
        .from("announcements")
        .select("id, title, event_at")
        .not("event_at", "is", null)
        .eq("is_deleted", false)
        .gte("event_at", monthStart)
        .lt("event_at", monthEndExclusive),
      supabase
        .from("profiles")
        .select("id, full_name, birthday")
        .eq("is_active", true)
        .not("birthday", "is", null),
      supabase
        .from("profiles")
        .select("id, full_name, start_date")
        .eq("is_active", true)
        .not("start_date", "is", null),
    ]);

  // Each source fails independently rather than the whole page
  // breaking if one has an issue — logged for debugging, not shown
  // raw to the user.
  for (const [label, result] of [
    ["company_events", companyEventsResult],
    ["announcements", announcementsResult],
    ["birthdays", birthdaysResult],
    ["anniversaries", anniversariesResult],
  ] as const) {
    if (result.error) {
      console.error(`getCalendarEventsForMonth (${label}) error:`, result.error.message);
    }
  }

  const events: CalendarEvent[] = [];

  for (const e of companyEventsResult.data ?? []) {
    events.push({
      id: `event-${e.id}`,
      title: e.title,
      date: e.event_date,
      type: "company_event",
      icsUrl: null,
      description: e.description,
    });
  }

  for (const a of announcementsResult.data ?? []) {
    events.push({
      id: `announcement-${a.id}`,
      title: a.title,
      date: a.event_at as string,
      type: "announcement",
      icsUrl: `/api/calendar/announcement/${a.id}`,
    });
  }

  for (const p of birthdaysResult.data ?? []) {
    const bday = new Date(`${p.birthday}T00:00:00Z`);
    if (bday.getUTCMonth() + 1 !== month) continue;
    const day = bday.getUTCDate();
    // Feb 29 on a non-leap requested year: skip rather than crash —
    // a known, shared edge case with the original Birthdays page.
    if (month === 2 && day === 29 && !isLeapYear(year)) continue;
    events.push({
      id: `birthday-${p.id}`,
      title: `${p.full_name}'s birthday`,
      date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      type: "birthday",
      icsUrl: null,
    });
  }

  for (const p of anniversariesResult.data ?? []) {
    const start = new Date(`${p.start_date}T00:00:00Z`);
    if (start.getUTCMonth() + 1 !== month) continue;
    const day = start.getUTCDate();
    if (month === 2 && day === 29 && !isLeapYear(year)) continue;
    const yearsAtCompany = year - start.getUTCFullYear();
    if (yearsAtCompany < 0) continue; // never show an anniversary before someone actually joined
    events.push({
      id: `anniversary-${p.id}`,
      title:
        yearsAtCompany === 0
          ? `${p.full_name} joined the team`
          : `${p.full_name}'s ${ordinal(yearsAtCompany)} work anniversary`,
      date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      type: "work_anniversary",
      icsUrl: null,
      years: yearsAtCompany,
    });
  }

  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return { events, error: null };
}