"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { markConversationRead, markConversationNotificationsRead } from "./actions";

export function MarkReadOnMount({ conversationId }: { conversationId: string }) {
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      markConversationRead(conversationId),
      markConversationNotificationsRead(conversationId),
    ]).then(() => router.refresh());
  }, [conversationId, router]);

  return null;
}