import { z } from "zod";

// Validates the data coming from the "New Announcement" form before it's
// ever sent to the database. This runs on the server (inside the
// server action), so it can't be bypassed just by editing the browser's
// HTML — it's the real gatekeeper, not just a UI nicety.
export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200),
  content: z.string().trim().min(1, "Content is required.").max(5000),
  scope: z.enum(["organization", "department"]),
  department_id: z.string().uuid().optional(),
  // Optional calendar event date/time, submitted as a datetime-local
  // input string (e.g. "2026-09-15T10:00"). z.string().optional() here
  // because an empty/unchecked field arrives as an empty string or is
  // simply absent from the form data — actual date parsing happens in
  // the action, not here, since we still need to handle "field wasn't
  // sent at all" separately from "field was sent but invalid."
  eventAt: z.string().optional(),
});

export const createAnnouncementCommentSchema = z.object({
  announcementId: z.string().uuid(),
  content: z.string().trim().min(1, "Comment can't be empty.").max(1000),
});