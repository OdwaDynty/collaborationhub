export type Post = {
  id: string;
  content: string;
  scope: "organization" | "department";
  created_at: string;
  author: {
    full_name: string;
  };
  department: {
    name: string;
  } | null;
};