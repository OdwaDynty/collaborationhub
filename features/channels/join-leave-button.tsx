"use client";

import { useState, useTransition } from "react";
import { joinChannel, leaveChannel } from "./actions";

export function JoinLeaveButton({
  channelId,
  isMember,
}: {
  channelId: string;
  isMember: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = isMember
        ? await leaveChannel(channelId)
        : await joinChannel(channelId);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="rounded border px-3 py-1 text-sm disabled:opacity-50"
      >
        {isPending ? "..." : isMember ? "Leave" : "Join"}
      </button>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}