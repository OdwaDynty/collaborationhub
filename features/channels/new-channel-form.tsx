"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner"; // same toast library already used on Home/Messages/Files
import { createChannel } from "./actions";

export function NewChannelForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createChannel(formData);
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        // Confirms creation succeeded — matches the confirmation pattern
        // already used for posts, messages, and file uploads elsewhere.
        toast.success("Channel created");
      }
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="space-y-3 rounded-xl border-[1.5px] border-brand-teal bg-white p-4"
    >
      <input
        name="name"
        required
        maxLength={80}
        placeholder="Channel name..."
        className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-brand-teal focus:outline-none"
      />
      <input
        name="description"
        maxLength={300}
        placeholder="What's this channel for? (optional)"
        className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-brand-teal focus:outline-none"
      />

      <div className="flex items-center justify-between">
        <select
          name="visibility"
          defaultValue="public"
          className="rounded-lg border border-hairline bg-canvas px-2 py-1 text-sm text-ink"
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand-teal px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-teal-ink disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create channel"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}