"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generateWeeklyDigest } from "./actions";

export function DigestCard({
  initialDigest,
}: {
  initialDigest: { content: string; generatedAt: string } | null;
}) {
  const [digest, setDigest] = useState(initialDigest);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateWeeklyDigest();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      // The action itself doesn't return the digest content (to keep
      // its return type simple and consistent with every other action
      // in this app) — a full page reload is the simplest, most
      // reliable way to pick up the freshly generated or already-
      // cached row.
      window.location.reload();
    });
  }

  return (
    <div className="rounded-xl border-[1.5px] border-brand-gold bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-gold" />
        <p className="text-sm font-medium text-ink">This week's insight</p>
      </div>

      {digest ? (
        <>
          <p className="text-sm leading-relaxed text-ink/80">{digest.content}</p>
          <p className="mt-2 text-xs text-ink/40">
            Generated {new Date(digest.generatedAt).toLocaleString()}
          </p>
        </>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink/50">
            No insight generated for this week yet.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="shrink-0 rounded-lg bg-brand-gold px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-gold-light disabled:opacity-50"
          >
            {isPending ? "Generating..." : "Generate"}
          </button>
        </div>
      )}
    </div>
  );
}