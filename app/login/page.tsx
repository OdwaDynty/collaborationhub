import Link from "next/link";
import { signIn, signUp } from "@/lib/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-canvas">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-heading text-xl font-semibold text-brand-teal-ink">
            Zibuke Africa
          </h1>
          <p className="text-sm text-ink/60">Sign in or create an account</p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <form className="space-y-3 rounded-2xl border-[1.5px] border-brand-teal bg-white p-6">
          <input
            name="fullName"
            placeholder="Full name (only needed for sign up)"
            className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm focus:border-brand-teal focus:outline-none"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm focus:border-brand-teal focus:outline-none"
          />
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink/50">Password</span>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-brand-teal hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Password"
              className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm focus:border-brand-teal focus:outline-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              formAction={signIn}
              className="flex-1 rounded-lg bg-brand-teal px-3 py-2 text-sm font-medium text-white hover:bg-brand-teal-ink"
            >
              Sign in
            </button>
            <button
              formAction={signUp}
              className="flex-1 rounded-lg border border-brand-teal px-3 py-2 text-sm font-medium text-brand-teal hover:bg-canvas"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}