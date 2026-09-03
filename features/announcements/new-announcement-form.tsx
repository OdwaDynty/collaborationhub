"use client";

import { useState, useTransition, useRef } from "react";
import { createAnnouncement, createAnnouncementComment } from "./actions";

type Department = { id: string; name: string };

export function NewAnnouncementForm({ departments }: { departments: Department[] }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [scope, setScope] = useState<"organization" | "department">("organization");
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createAnnouncement(formData);
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        setScope("organization");
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
        name="title"
        required
        maxLength={200}
        placeholder="Announcement title..."
        className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-brand-teal focus:outline-none"
      />
      <textarea
        name="content"
        required
        maxLength={5000}
        rows={3}
        placeholder="Announcement content..."
        className="w-full resize-none rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-brand-teal focus:outline-none"
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <select
            name="scope"
            value={scope}
            onChange={(e) => setScope(e.target.value as "organization" | "department")}
            className="rounded-lg border border-hairline bg-canvas px-2 py-1 text-sm text-ink"
          >
            <option value="organization">Organization</option>
            <option value="department">Specific department</option>
          </select>

          {scope === "department" && (
            <select
              name="department_id"
              required
              className="rounded-lg border border-hairline bg-canvas px-2 py-1 text-sm text-ink"
            >
              <option value="">Select department...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand-teal px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-teal-ink disabled:opacity-50"
        >
          {isPending ? "Publishing..." : "Publish"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}

export function NewAnnouncementCommentForm({ announcementId }: { announcementId: string }) {
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
    <form ref={formRef} action={handleSubmit} className="mt-3 flex gap-2 border-t border-hairline pt-3">
      <input type="hidden" name="announcementId" value={announcementId} />
      <input
        name="content"
        placeholder="Write a comment..."
        maxLength={1000}
        required
        className="flex-1 rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-sm text-ink focus:border-brand-teal focus:outline-none"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg border border-hairline px-3 py-1.5 text-sm text-ink/70 transition-colors hover:bg-canvas disabled:opacity-50"
      >
        {isPending ? "..." : "Reply"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}