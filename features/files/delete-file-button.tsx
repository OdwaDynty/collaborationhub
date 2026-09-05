"use client";

import { useState, useTransition } from "react";
import { Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteFile } from "./actions";

/**
 * Delete button for one file, with an inline two-step confirmation
 * (no native browser confirm() dialog, no separate modal — just a
 * small state change in place) so an accidental click can never
 * immediately delete something.
 *
 * Step 1: shows a plain trash icon.
 * Step 2 (after clicking once): swaps to a small red "Confirm" /
 * "Cancel" pair. Only clicking "Confirm" actually deletes anything.
 */
export function DeleteFileButton({ fileId }: { fileId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteFile(fileId);
      if (result.error) {
        toast.error(result.error);
        setConfirming(false);
      } else {
        toast.success("File deleted");
        // No need to reset `confirming` on success — the whole row
        // disappears from the list once the page revalidates.
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-lg bg-red-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? "..." : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          aria-label="Cancel"
          className="rounded-lg p-1 text-ink/40 transition-colors hover:bg-canvas hover:text-ink"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      aria-label="Delete file"
      className="rounded-lg p-2 text-ink/40 transition-colors hover:bg-red-50 hover:text-red-600"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}