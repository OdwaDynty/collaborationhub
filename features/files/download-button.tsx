"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { getFileDownloadUrl } from "./actions";

export function DownloadButton({ storagePath }: { storagePath: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await getFileDownloadUrl(storagePath);
      if (result.error || !result.url) {
        setError(result.error ?? "Unable to download.");
      } else {
        window.open(result.url, "_blank");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        aria-label="Download"
        className="rounded-lg p-2 text-ink/50 transition-colors hover:bg-canvas hover:text-brand-teal disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}