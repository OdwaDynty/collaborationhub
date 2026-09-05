import Link from "next/link";
import { CompassIcon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-teal/10">
        <CompassIcon className="h-7 w-7 text-brand-teal-ink" />
      </div>
      <div>
        <h1 className="font-heading text-xl font-semibold text-ink">
          Page not found
        </h1>
        <p className="mt-1 max-w-sm text-sm text-ink/50">
          The page you're looking for doesn't exist, or may have moved.
        </p>
      </div>
      <Link
        href="/home"
        className="rounded-lg bg-brand-teal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-teal-ink"
      >
        Back to Home
      </Link>
    </div>
  );
}