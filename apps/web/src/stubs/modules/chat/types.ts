export type ConversationListItem = {
  conversationId: string;
  title: string;
  lastMessage?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

