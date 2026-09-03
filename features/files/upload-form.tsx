"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { uploadFile } from "./actions";

type ChannelOption = { id: string; name: string };

export function UploadForm({ channels }: { channels: ChannelOption[] }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await uploadFile(formData);
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        toast.success("File uploaded");
      }
    });
  }

  if (channels.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-hairline p-4 text-sm text-ink/50">
        Join a channel first to start sharing files there.
      </p>
    );
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="space-y-3 rounded-xl border-[1.5px] border-brand-teal bg-white p-4"
    >
      <div className="flex flex-wrap gap-2">
        <select
          name="channelId"
          required
          className="rounded-lg border border-hairline bg-canvas px-2 py-2 text-sm text-ink"
        >
          <option value="">Select a channel...</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              # {c.name}
            </option>
          ))}
        </select>
        <input
          type="file"
          name="file"
          required
          className="flex-1 rounded-lg border border-hairline bg-canvas px-2 py-2 text-sm text-ink"
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink/40">Max 4MB per file</p>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand-teal px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-teal-ink disabled:opacity-50"
        >
          {isPending ? "Uploading..." : "Upload"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}