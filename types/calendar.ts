// One shared shape for any "thing with a date" the calendar page shows,
// whether it originally came from Announcements or Birthdays. This lets
// the page render one unified, sorted list instead of two separate
// sections glued together.
export type CalendarEvent = {
  id: string;
  title: string;
  date: string; // ISO date-time string
  type: "announcement" | "birthday";
  // Only announcements can generate a downloadable .ics file — a
  // birthday isn't a calendar-syncable "event" in the same sense, so
  // this is null for birthday entries.
  icsUrl: string | null;
};