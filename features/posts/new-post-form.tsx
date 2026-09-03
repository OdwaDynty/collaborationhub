"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
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
        toast.success("Posted");
      }
    });
  }

  return (
    <form
      id="new-post-form"
      action={handleSubmit}
      className="space-y-3 rounded-xl border-[1.5px] border-brand-teal bg-white p-4 transition-shadow focus-within:shadow-sm"
    >
      <textarea
        name="content"
        required
        maxLength={2000}
        rows={3}
        placeholder="Share an update..."
        className="w-full resize-none rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-brand-teal focus:outline-none"
      />

      <div className="flex items-center justify-between">
        {canChooseScope ? (
          <select
            name="scope"
            defaultValue={defaultScope}
            className="rounded-lg border border-hairline bg-canvas px-2 py-1 text-sm text-ink"
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
          className="rounded-lg bg-brand-teal px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-teal-ink disabled:opacity-50"
        >
          {isPending ? "Posting..." : "Post"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}