// Shared TypeScript types for the Announcements feature. Keeping these
// in one place means every file that touches an Announcement agrees on
// its exact shape — if the database changes, this is the one file to
// update, and TypeScript will then flag every place that needs fixing.

export type Announcement = {
  id: string;
  title: string;
  content: string;
  scope: "organization" | "department";
  created_at: string;
  // ISO timestamp string if this announcement has an associated calendar
  // event (e.g. "Q3 All-Hands"), or null if it's just a regular
  // announcement with no specific date/time attached.
  event_at: string | null;
  author: {
    full_name: string;
  };
  department: {
    name: string;
  } | null;
};

export type AnnouncementComment = {
  id: string;
  content: string;
  created_at: string;
  author: {
    full_name: string;
  };
};