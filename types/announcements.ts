export type Announcement = {
  id: string;
  title: string;
  content: string;
  // A short AI-generated TL;DR, or null if one hasn't been generated
  // (e.g. the AI call failed at publish time) — the UI should treat
  // null as "no summary available", never as an error.
  summary: string | null;
  scope: "organization" | "department";
  created_at: string;
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
  authorId: string;
  author: {
    full_name: string;
  };
};