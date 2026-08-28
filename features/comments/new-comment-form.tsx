"use client";

import { useState, useTransition, useRef } from "react";
import { createComment } from "./actions";

export function NewCommentForm({ postId }: { postId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createComment(formData);
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
      className="mt-2 flex gap-2"
    >
      <input type="hidden" name="postId" value={postId} />
      <input
        name="content"
        placeholder="Write a comment..."
        maxLength={1000}
        required
        className="flex-1 rounded border px-2 py-1 text-sm"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded border px-3 py-1 text-sm disabled:opacity-50"
      >
        {isPending ? "..." : "Reply"}
      </button>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}