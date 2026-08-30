export type Conversation = {
  id: string;
  other_participant: {
    id: string;
    full_name: string;
  };
  last_message: {
    content: string;
    created_at: string;
    sender_id: string;
  } | null;
  unread: boolean;
};

export type DirectMessage = {
  id: string;
  content: string;
  sender_id: string;
  parent_message_id: string | null;
  created_at: string;
};