export type Channel = {
  id: string;
  name: string;
  description: string | null;
  visibility: "public" | "private";
  created_by: string;
  created_at: string;
  is_member: boolean;
};

export type ChannelMessage = {
  id: string;
  content: string;
  parent_message_id: string | null;
  created_at: string;
  authorId: string;
  author: {
    full_name: string;
  };
};