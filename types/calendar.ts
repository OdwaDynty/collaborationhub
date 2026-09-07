// One shared shape for any "thing with a date" the calendar shows,
// across all four sources it now combines.
export type CalendarEventType =
  | "announcement"
  | "birthday"
  | "company_event"
  | "work_anniversary";

export type CalendarEvent = {
  id: string;
  title: string;
  date: string; // ISO date (YYYY-MM-DD) or date-time string
  type: CalendarEventType;
  // Only announcements can generate a downloadable .ics file.
  icsUrl: string | null;
  // Only present for company events.
  description?: string | null;
  // Only present for work anniversaries — lets the UI distinguish
  // "James joined the team" (0) from "James's 3rd work anniversary".
  years?: number;
};