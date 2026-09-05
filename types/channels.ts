export type Channel = {
  id: string;
  name: string;
  description: string | null;
  visibility: "public" | "private";
  created_by: string;
  created_at: string;
  is_member: boolean;
  // Whether an admin has archived this channel. Present on the type
  // now so the channel detail page can show a read-only banner
  // instead of the composer when true.
  is_archived: boolean;
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