export type SearchResults = {
  people: { id: string; full_name: string; job_title: string | null }[];
  posts: { id: string; content: string; created_at: string }[];
  announcements: { id: string; title: string; created_at: string }[];
  channels: { id: string; name: string; description: string | null }[];
};