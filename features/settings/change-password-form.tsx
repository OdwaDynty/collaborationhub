"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { updatePassword } from "@/lib/auth/actions";

/**
 * Self-service "change my password" form, shown on the Settings page.
 * This is a client component because it needs local state (the error
 * message, the pending/loading state) and a ref to reset the form
 * after a successful submit.
 */
export function ChangePasswordForm() {
  // error: holds a validation/server error message to display, or null
  // if there's nothing to show right now.
  const [error, setError] = useState<string | null>(null);

  // isPending: true while the server action is running — used to
  // disable the submit button and show "Updating..." instead of "Update
  // password", so the user gets feedback that something is happening.
  const [isPending, startTransition] = useTransition();

  // formRef: lets us call .reset() on the actual <form> DOM element
  // after a successful password change, clearing both password fields.
  const formRef = useRef<HTMLFormElement>(null);

  // handleSubmit runs when the form is submitted. It's passed directly
  // to the <form action={...}> prop, which is how Next.js wires a
  // client-side handler up to a server action.
  function handleSubmit(formData: FormData) {
    setError(null); // clear any previous error before trying again
    startTransition(async () => {
      const result = await updatePassword(formData);
      if (result.error) {
        // Show the error returned by the server action.
        setError(result.error);
      } else {
        // Success: clear the form fields and show a toast confirmation
        // (the same toast pattern used elsewhere in the app — Home,
        // Messages, Files — for consistency).
        formRef.current?.reset();
        toast.success("Password updated");
      }
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      // Same "elevated card" treatment as other primary forms in the
      // app (Home's post composer, the Channel creation form) — a
      // slightly thicker teal border marks this as the main
      // interactive element on the page.
      className="space-y-3 rounded-xl border-[1.5px] border-brand-teal bg-white p-4"
    >
      <div>
        <label className="mb-1 block text-xs text-ink/50">New password</label>
        <input
          name="newPassword"
          type="password"
          required
          minLength={6} // matches the server-side check in updatePassword()
          className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-brand-teal focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink/50">Confirm new password</label>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-brand-teal focus:outline-none"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending} // prevents double-submitting while the request is in flight
          className="rounded-lg bg-brand-teal px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-teal-ink disabled:opacity-50"
        >
          {isPending ? "Updating..." : "Update password"}
        </button>
      </div>
      {/* Only rendered when there's actually an error to show */}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}