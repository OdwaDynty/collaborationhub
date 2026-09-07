"use client";

import { useState } from "react";
import Link from "next/link";
import { Cake, Award, CalendarDays, Speaker, CalendarPlus } from "lucide-react";
import type { CalendarEvent } from "@/types/calendar";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const EVENT_ICONS = {
  birthday: Cake,
  work_anniversary: Award,
  company_event: CalendarDays,
  announcement: Speaker,
};

/**
 * Small colored dot per event type, shown inside each day cell.
 * Deliberately stays within the existing teal/gold brand palette
 * (filled vs. outline distinguishes the two "quiet" types from the
 * two "notable" types) rather than introducing new colors just for
 * this feature — matches the "modern but humble" design direction.
 */
function EventDot({ type }: { type: CalendarEvent["type"] }) {
  const styles: Record<CalendarEvent["type"], string> = {
    birthday: "bg-brand-gold",
    work_anniversary: "border border-brand-gold bg-transparent",
    company_event: "bg-brand-teal",
    announcement: "border border-brand-teal bg-transparent",
  };
  return <span className={`h-1.5 w-1.5 rounded-full ${styles[type]}`} />;
}

type DayCell = {
  day: number;
  dateStr: string;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  isToday: boolean;
};

/**
 * Builds the full grid of day cells for a given month, including
 * leading/trailing days from the adjacent months so every row has a
 * full 7 columns (Monday-start, matching the same convention already
 * used by lib/dates.ts's getWeekStart()).
 */
function buildMonthGrid(year: number, month: number, events: CalendarEvent[]): DayCell[] {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  // JS getUTCDay(): 0=Sun...6=Sat. Converting to Monday-start index
  // (0=Mon...6=Sun) so the grid's first column is always Monday.
  const leadingBlanks = (firstOfMonth.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const todayStr = new Date().toISOString().split("T")[0];

  // Group events by date string once, up front, rather than filtering
  // the whole events array again for every single cell.
  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const dateKey = event.date.split("T")[0];
    const existing = eventsByDate.get(dateKey) ?? [];
    existing.push(event);
    eventsByDate.set(dateKey, existing);
  }

  const cells: DayCell[] = [];

  // Leading padding cells from the previous month — shown dimmed,
  // never carry events (out of scope for THIS month's fetch anyway).
  const prevMonthLastDay = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();
  for (let i = leadingBlanks - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    cells.push({ day, dateStr: "", events: [], isCurrentMonth: false, isToday: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({
      day,
      dateStr,
      events: eventsByDate.get(dateStr) ?? [],
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  // Trailing padding cells to complete the final week row.
  const trailingBlanks = (7 - (cells.length % 7)) % 7;
  for (let day = 1; day <= trailingBlanks; day++) {
    cells.push({ day, dateStr: "", events: [], isCurrentMonth: false, isToday: false });
  }

  return cells;
}

export function CalendarGrid({
  year,
  month,
  events,
}: {
  year: number;
  month: number;
  events: CalendarEvent[];
}) {
  const cells = buildMonthGrid(year, month, events);
  const todayStr = new Date().toISOString().split("T")[0];
  // Defaults to today's events if today falls within the displayed
  // month; otherwise no day is pre-selected.
  const [selectedDate, setSelectedDate] = useState<string | null>(
    cells.some((c) => c.dateStr === todayStr) ? todayStr : null
  );

  const selectedEvents = selectedDate
    ? cells.find((c) => c.dateStr === selectedDate)?.events ?? []
    : [];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-hairline bg-white">
        <div className="grid grid-cols-7 border-b border-hairline bg-canvas">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="p-2 text-center text-xs font-medium text-ink/40">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => (
            <button
              key={i}
              onClick={() => cell.isCurrentMonth && setSelectedDate(cell.dateStr)}
              disabled={!cell.isCurrentMonth}
              className={`flex min-h-[52px] flex-col items-center gap-1 border-b border-r border-hairline p-1.5 text-left transition-colors sm:min-h-[70px] sm:items-start sm:p-2 ${
                !cell.isCurrentMonth ? "bg-canvas/40" : "bg-white hover:bg-canvas"
              } ${selectedDate === cell.dateStr ? "!bg-brand-teal/10" : ""}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  cell.isToday
                    ? "bg-brand-teal font-semibold text-white"
                    : cell.isCurrentMonth
                      ? "text-ink"
                      : "text-ink/30"
                }`}
              >
                {cell.day}
              </span>
              {cell.events.length > 0 && (
                <div className="flex flex-wrap gap-0.5">
                  {cell.events.slice(0, 4).map((e) => (
                    <EventDot key={e.id} type={e.type} />
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel for whichever day is selected — shows full
          titles, icons, and (for announcements) the calendar download
          link, rather than trying to cram that into the tiny grid
          cells themselves. */}
      <div className="rounded-xl border border-hairline bg-white p-4">
        <p className="mb-3 text-sm font-medium text-ink">
          {selectedDate
            ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })
            : "Select a day"}
        </p>
        {selectedDate && selectedEvents.length === 0 && (
          <p className="text-sm text-ink/50">Nothing scheduled.</p>
        )}
        {selectedEvents.length > 0 && (
          <ul className="space-y-2">
            {selectedEvents.map((event) => {
              const Icon = EVENT_ICONS[event.type];
              return (
                <li key={event.id} className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-teal/10">
                    <Icon className="h-3.5 w-3.5 text-brand-teal-ink" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">{event.title}</p>
                    {event.description && (
                      <p className="text-xs text-ink/50">{event.description}</p>
                    )}
                  </div>
                  {event.icsUrl && (
                    <Link
                      href={event.icsUrl}
                      className="flex shrink-0 items-center gap-1 rounded-full bg-brand-teal/10 px-2.5 py-1 text-xs font-medium text-brand-teal-ink hover:bg-brand-teal/20"
                    >
                      <CalendarPlus className="h-3 w-3" />
                      Add
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}