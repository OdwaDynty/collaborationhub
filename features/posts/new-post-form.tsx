"use client";

import { useState, useTransition } from "react";
import { createPost } from "./actions";

type Permissions = {
  can_post_org_wide: boolean;
  can_post_department: boolean;
};

export function NewPostForm({ permissions }: { permissions: Permissions }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canChooseScope =
    permissions.can_post_org_wide && permissions.can_post_department;
  const defaultScope = permissions.can_post_org_wide
    ? "organization"
    : "department";

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createPost(formData);
      if (result.error) {
        setError(result.error);
      } else {
        const form = document.getElementById(
          "new-post-form"
        ) as HTMLFormElement | null;
        form?.reset();
      }
    });
  }

  return (
    <form
      id="new-post-form"
      action={handleSubmit}
      className="space-y-2 rounded border p-4"
    >
      <textarea
        name="content"
        required
        maxLength={2000}
        rows={3}
        placeholder="Share an update..."
        className="w-full resize-none rounded border px-3 py-2 text-sm"
      />

      <div className="flex items-center justify-between">
        {canChooseScope ? (
          <select
            name="scope"
            defaultValue={defaultScope}
            className="rounded border px-2 py-1 text-sm"
          >
            <option value="organization">Organization</option>
            <option value="department">My department</option>
          </select>
        ) : (
          <input type="hidden" name="scope" value={defaultScope} />
        )}

        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {isPending ? "Posting..." : "Post"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}