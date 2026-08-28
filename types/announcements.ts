export type AnnouncementComment = {
  id: string;
  content: string;
  created_at: string;
  author: { full_name: string };
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author: { full_name: string };
};