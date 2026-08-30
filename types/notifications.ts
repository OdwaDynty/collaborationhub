export type NotificationSummary = {
  directMessages: {
    unreadCount: number;
    items: {
      id: string;
      conversationId: string;
      content: string;
      createdAt: string;
    }[];
  };
  channelsWithUnread: {
    channelId: string;
    name: string;
  }[];
  announcementsUnread: boolean;
};