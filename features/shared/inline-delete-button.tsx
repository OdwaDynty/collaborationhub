"use client";

import { useState, useTransition } from "react";
import { Trash2, X } from "lucide-react";
import { toast } from "sonner";

/**
 * A small, reusable delete button with an inline two-step confirmation.
 *
 * IMPORTANT: `deleteAction` must be the ACTUAL Server Action function
 * reference (e.g. `deletePost` imported directly from an actions.ts
 * file) — never a new arrow function wrapped around it, like
 * `() => deletePost(post.id)`. Only the real, direct reference to a
 * "use server" function is something Next.js knows how to safely send
 * from a Server Component down to this Client Component. A fresh
 * closure wrapping it is just an ordinary JavaScript function with no
 * such special handling, and Next.js will reject it outright — which
 * is exactly the "Event handlers cannot be passed to Client Component
 * props" error this fixes.
 *
 * Instead, this component takes the raw action PLUS whatever
 * arguments it needs as a plain, serializable array (`args`) — both
 * of which travel safely across the server/client boundary — and
 * calls `deleteAction(...args)` itself, from inside the browser,
 * where calling a Server Action with arguments is always safe.
 */
export function InlineDeleteButton<Args extends unknown[]>({
  deleteAction,
  args,
  successMessage = "Deleted",
}: {
  deleteAction: (...args: Args) => Promise<{ error: string | null }>;
  args: Args;
  successMessage?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteAction(...args);
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
          className="rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? "..." : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          aria-label="Cancel"
          className="rounded-md p-1 text-ink/40 transition-colors hover:bg-canvas hover:text-ink"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      aria-label="Delete"
      className="rounded-md p-1 text-ink/30 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}