"use client";

import { useState, useTransition, useRef } from "react";
import { createAnnouncement, createAnnouncementComment } from "./actions";

export function NewAnnouncementForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createAnnouncement(formData);
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
        name="title"
        required
        maxLength={200}
        placeholder="Announcement title"
        className="w-full rounded border px-3 py-2 text-sm font-medium"
      />
      <textarea
        name="content"
        required
        maxLength={5000}
        rows={3}
        placeholder="Announcement details..."
        className="w-full resize-none rounded border px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {isPending ? "Publishing..." : "Publish"}
      </button>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}

export function NewAnnouncementCommentForm({
  announcementId,
}: {
  announcementId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createAnnouncementComment(formData);
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="mt-2 flex gap-2">
      <input type="hidden" name="announcementId" value={announcementId} />
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