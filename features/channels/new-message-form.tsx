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
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex gap-2 rounded-xl border-[1.5px] border-brand-teal bg-white p-2"
    >
      <input
        name="content"
        placeholder="Message this channel..."
        maxLength={2000}
        required
        className="flex-1 rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-brand-teal focus:outline-none"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-brand-teal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-teal-ink disabled:opacity-50"
      >
        {isPending ? "..." : "Send"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}