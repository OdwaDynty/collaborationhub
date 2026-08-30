"use client";

import { useState, useTransition, useRef } from "react";
import { postChannelMessage } from "./actions";

export function NewMessageForm({ channelId }: { channelId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await postChannelMessage(channelId, formData);
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex gap-2">
      <input
        name="content"
        placeholder="Message this channel..."
        maxLength={2000}
        required
        className="flex-1 rounded border px-2 py-1 text-sm"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded border px-3 py-1 text-sm disabled:opacity-50"
      >
        {isPending ? "..." : "Send"}
      </button>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}