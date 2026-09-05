"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, X } from "lucide-react";
import { toast } from "sonner";
import { archiveChannel, unarchiveChannel } from "@/features/channels/actions";

/**
 * One button component covering both directions — archive and
 * unarchive — since the interaction shape (click, then confirm) is
 * identical either way; only the action called, the label, and the
 * icon differ, controlled by the `mode` prop.
 */
export function ChannelArchiveButton({
  channelId,
  mode,
}: {
  channelId: string;
  mode: "archive" | "unarchive";
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const action = mode === "archive" ? archiveChannel : unarchiveChannel;
  const label = mode === "archive" ? "Archive" : "Unarchive";
  const Icon = mode === "archive" ? Archive : ArchiveRestore;
  const successMessage = mode === "archive" ? "Channel archived" : "Channel unarchived";

  function handleConfirm() {
    startTransition(async () => {
      const result = await action(channelId);
      if (result.error) {
        toast.error(result.error);
        setConfirming(false);
      } else {
        toast.success(successMessage);
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleConfirm}
          disabled={isPending}
          className="rounded-md bg-brand-gold px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-brand-gold-light disabled:opacity-50"
        >
          {isPending ? "..." : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          aria-label="Cancel"
          className="rounded-md p-1 text-ink/40 transition-colors hover:bg-canvas hover:text-ink"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-1 text-xs text-ink/70 transition-colors hover:bg-canvas"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}