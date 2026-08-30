"use client";

import { useState, useTransition, useRef } from "react";
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
      }
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="space-y-2 rounded border p-4"
    >
      <input
        name="name"
        required
        maxLength={80}
        placeholder="Channel name..."
        className="w-full rounded border px-3 py-2 text-sm"
      />
      <input
        name="description"
        maxLength={300}
        placeholder="What's this channel for? (optional)"
        className="w-full rounded border px-3 py-2 text-sm"
      />

      <div className="flex items-center justify-between">
        <select
          name="visibility"
          defaultValue="public"
          className="rounded border px-2 py-1 text-sm"
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>

        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {isPending ? "Creating..." : "Create channel"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}