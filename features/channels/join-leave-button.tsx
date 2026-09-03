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
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
          isMember
            ? "border border-hairline text-ink/60 hover:bg-canvas"
            : "bg-brand-teal text-white hover:bg-brand-teal-ink"
        }`}
      >
        {isPending ? "..." : isMember ? "Leave" : "Join"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}