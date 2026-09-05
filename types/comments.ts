export type Comment = {
  id: string;
  content: string;
  created_at: string;
  authorId: string;
  author: {
    full_name: string;
  };
};