"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { findOrCreateConversation } from "./actions";

export function MessageButton({ profileId }: { profileId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await findOrCreateConversation(profileId);
      if (result.error) {
        setError(result.error);
      } else if (result.conversationId) {
        router.push(`/messages/${result.conversationId}`);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="rounded border px-3 py-1 text-sm disabled:opacity-50"
      >
        {isPending ? "..." : "Message"}
      </button>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}