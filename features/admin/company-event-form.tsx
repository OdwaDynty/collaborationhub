"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { createCompanyEvent } from "./actions";

export function CompanyEventForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createCompanyEvent(formData);
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        toast.success("Event created");
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
        placeholder="Event title (e.g. Public Holiday, All-Hands)..."
        className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-brand-teal focus:outline-none"
      />
      <input
        name="description"
        maxLength={500}
        placeholder="Description (optional)..."
        className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-brand-teal focus:outline-none"
      />
      <div className="flex items-center justify-between gap-2">
        <input
          type="date"
          name="event_date"
          required
          className="rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-brand-teal focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand-teal px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-teal-ink disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create event"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}