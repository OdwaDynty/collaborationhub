import { signIn, signUp } from "@/lib/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-teal-50">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-teal-900">
            Zibuke Africa
          </h1>
          <p className="text-sm text-teal-700">
            Sign in or create an account
          </p>
        </div>

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <form className="space-y-3 rounded-lg border border-teal-100 bg-white p-6 shadow-sm">
          <input
            name="fullName"
            placeholder="Full name (only needed for sign up)"
            className="w-full rounded border border-teal-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full rounded border border-teal-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Password"
            className="w-full rounded border border-teal-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />

          <div className="flex gap-2">
            <button
              formAction={signIn}
              className="flex-1 rounded bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              Sign in
            </button>
            <button
              formAction={signUp}
              className="flex-1 rounded border border-teal-300 px-3 py-2 text-sm font-medium text-teal-800 hover:bg-teal-50"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}