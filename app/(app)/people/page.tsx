import Link from "next/link";
import { searchPeople } from "@/features/people/queries";
import { MessageButton } from "@/features/direct-messages/message-button";
import { createClient } from "@/lib/supabase/server";

const AVATAR_TINTS = [
  { bg: "bg-brand-teal/10", text: "text-brand-teal-ink" },
  { bg: "bg-brand-gold/15", text: "text-brand-gold" },
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function getAvatarTint(name: string) {
  const sum = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_TINTS[sum % AVATAR_TINTS.length];
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page = "0" } = await searchParams;
  const currentPage = Number(page) || 0;
  const { people, total, error } = await searchPeople(q, currentPage);
  const totalPages = Math.ceil(total / 20);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-6">
      <form className="flex gap-2 rounded-xl border-[1.5px] border-brand-teal bg-white p-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name..."
          className="flex-1 rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-brand-teal focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-teal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-teal-ink"
        >
          Search
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && people.length === 0 && (
        <p className="text-sm text-ink/50">No employees found.</p>
      )}

      <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-white">
        {people.map((person) => {
          const tint = getAvatarTint(person.full_name);
          return (
            <li key={person.id} className="flex items-center gap-3 p-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-heading text-xs font-semibold ${tint.bg} ${tint.text}`}
              >
                {getInitials(person.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/people/${person.id}`}
                  className="font-heading text-sm font-semibold text-ink hover:underline"
                >
                  {person.full_name}
                </Link>
                <p className="truncate text-sm text-ink/50">
                  {person.job_title ?? "—"}
                  {person.department && ` · ${person.department.name}`}
                  {person.department?.business_unit &&
                    ` · ${person.department.business_unit.name}`}
                  {person.department?.business_unit?.country &&
                    ` · ${person.department.business_unit.country.name}`}
                </p>
              </div>
              {person.id !== user?.id && <MessageButton profileId={person.id} />}
            </li>
          );
        })}
      </ul>

      {totalPages > 1 && (
        <div className="flex justify-between text-sm">
          <Link
            href={`?q=${q}&page=${Math.max(0, currentPage - 1)}`}
            className={
              currentPage === 0
                ? "pointer-events-none opacity-40"
                : "font-medium text-brand-teal underline"
            }
          >
            Previous
          </Link>
          <span className="text-ink/50">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Link
            href={`?q=${q}&page=${Math.min(totalPages - 1, currentPage + 1)}`}
            className={
              currentPage >= totalPages - 1
                ? "pointer-events-none opacity-40"
                : "font-medium text-brand-teal underline"
            }
          >
            Next
          </Link>
        </div>
      )}
    </div>
  );
}