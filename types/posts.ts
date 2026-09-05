export type Post = {
  id: string;
  content: string;
  scope: "organization" | "department";
  created_at: string;
  // The author's profile id — needed to compare against the currently
  // signed-in user, to decide whether THEY get to see a delete button
  // on this specific post.
  authorId: string;
  author: {
    full_name: string;
  };
  department: {
    name: string;
  } | null;
};