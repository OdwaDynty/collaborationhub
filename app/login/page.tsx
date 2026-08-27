import { signIn, signUp } from "@/lib/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Zibuke Africa
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Sign in or create an account
          </p>
        </div>

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <form className="space-y-3">
          <input
            name="fullName"
            placeholder="Full name (only needed for sign up)"
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Password"
            className="w-full rounded border px-3 py-2 text-sm"
          />

          <div className="flex gap-2">
            <button
              formAction={signIn}
              className="flex-1 rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
            >
              Sign in
            </button>
            <button
              formAction={signUp}
              className="flex-1 rounded border px-3 py-2 text-sm font-medium"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}