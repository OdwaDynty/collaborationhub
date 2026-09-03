"use client";

import { useState, useTransition, useRef } from "react";
import { createBirthdayWish } from "./actions";

export function NewWishForm({ profileId }: { profileId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createBirthdayWish(formData);
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="mt-3">
      <input type="hidden" name="profileId" value={profileId} />
      <div className="flex gap-2">
        <input
          name="content"
          placeholder="Write a birthday message..."
          maxLength={500}
          required
          className="flex-1 rounded-lg bg-brand-teal px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-brand-gold"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand-gold px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-gold-light disabled:opacity-50"
        >
          {isPending ? "..." : "Send"}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </form>
  );
}