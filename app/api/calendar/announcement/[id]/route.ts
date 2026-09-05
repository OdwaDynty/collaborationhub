import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Generates a downloadable .ics calendar file for one announcement's
 * event. This is a normal (non-API-key, non-service-role) route —
 * it uses the visitor's own logged-in session, so Supabase's existing
 * Row Level Security automatically applies: if someone couldn't see
 * this announcement on the Announcements page, they can't download
 * its calendar file either. No extra permission logic needed here.
 *
 * .ics is a plain-text, open standard format — not a Google-specific
 * thing. Any calendar app (Google Calendar, Outlook, Apple Calendar)
 * knows how to open one, which is exactly why we chose this over a
 * Google-only OAuth integration.
 */

// Escapes characters that have special meaning in the .ics format.
// Without this, a comma or semicolon in someone's announcement text
// could corrupt the file structure for the calendar app reading it.
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// Converts a JavaScript Date into the exact date-time format the .ics
// spec requires: "20260915T100000Z" (year, month, day, T, hour,
// minute, second, Z for UTC) — no dashes, no colons.
function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: announcement, error } = await supabase
    .from("announcements")
    .select("id, title, content, event_at")
    .eq("id", id)
    .single();

  if (error || !announcement) {
    return NextResponse.json({ error: "Announcement not found." }, { status: 404 });
  }

  if (!announcement.event_at) {
    return NextResponse.json(
      { error: "This announcement has no calendar event." },
      { status: 400 }
    );
  }

  const startDate = new Date(announcement.event_at);
  // Default event length: 1 hour. The form doesn't currently collect
  // an end time (keeping the composer simple, per "don't overbuild") —
  // this is a reasonable default most calendar apps handle gracefully,
  // and the user can always adjust the duration in their own calendar
  // app after adding it.
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  // Building the actual .ics file content, line by line, per the
  // iCalendar (RFC 5545) format. Every line matters — calendar apps
  // are strict about this structure.
  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Zibuke Africa//Collaboration Hub//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${announcement.id}@collaborationhub.vercel.app`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:${escapeIcsText(announcement.title)}`,
    `DESCRIPTION:${escapeIcsText(announcement.content)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // .ics files require lines to be joined with \r\n specifically
  // (carriage return + line feed), not just \n — this is part of the
  // format spec, and some calendar apps are strict about it.
  const icsContent = icsLines.join("\r\n");

  return new NextResponse(icsContent, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      // "attachment" tells the browser to download the file rather
      // than try to display it as a webpage.
      "Content-Disposition": `attachment; filename="${announcement.id}.ics"`,
    },
  });
}