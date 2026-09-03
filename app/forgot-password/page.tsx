import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth/actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-canvas">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-heading text-xl font-semibold text-brand-teal-ink">
            Reset your password
          </h1>
          <p className="text-sm text-ink/60">
            We&apos;ll send a reset link to your email
          </p>
        </div>

        <div className="rounded-2xl border-[1.5px] border-brand-teal bg-white p-6">
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-ink/80">
                If an account exists for that email, a reset link is on its
                way.
              </p>
              <Link
                href="/login"
                className="block text-sm font-medium text-brand-teal hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form action={requestPasswordReset} className="space-y-3">
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <input
                name="email"
                type="email"
                required
                placeholder="Email"
                className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm focus:border-brand-teal focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-brand-teal px-3 py-2 text-sm font-medium text-white hover:bg-brand-teal-ink"
              >
                Send reset link
              </button>
              <Link
                href="/login"
                className="block text-center text-sm font-medium text-brand-teal hover:underline"
              >
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}