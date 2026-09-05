import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent } from "@/types/calendar";

/**
 * Builds one combined, date-sorted list of upcoming calendar events —
 * announcements that have an event_at set, plus upcoming birthdays.
 * This reuses two data sources that already exist (announcements,
 * get_upcoming_birthdays) rather than introducing a third table just
 * for "things with dates."
 */
export async function getUpcomingCalendarEvents(): Promise<{
  events: CalendarEvent[];
  error: string | null;
}> {
  const supabase = await createClient();

  // Announcements with a calendar event attached, upcoming only (not
  // ones that already happened in the past).
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

  // Reuses the same database function the Birthdays page already
  // calls — no new birthday-fetching logic needed here.
  const { data: birthdayRows, error: birthdayError } = await supabase.rpc(
    "get_upcoming_birthdays",
    { days_ahead: 30 }
  );

  if (birthdayError) {
    console.error("getUpcomingCalendarEvents (birthdays) error:", birthdayError.message);
    // Not treated as a hard failure — still show announcement events
    // even if birthdays failed to load for some reason.
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

  // Merge both lists and sort by date so everything appears in one
  // single chronological timeline, not two separate blocks.
  const events = [...announcementEvents, ...birthdayEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return { events, error: null };
}