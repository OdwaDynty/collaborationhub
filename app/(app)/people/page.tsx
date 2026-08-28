import { searchPeople } from "@/features/people/queries";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page = "0" } = await searchParams;
  const currentPage = Number(page) || 0;
  const { people, total, error } = await searchPeople(q, currentPage);
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-6">
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name..."
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded border px-4 py-2 text-sm">
          Search
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && people.length === 0 && (
        <p className="text-sm text-zinc-500">No employees found.</p>
      )}

      <ul className="divide-y rounded border">
        {people.map((person) => (
          <li key={person.id} className="p-3">
            <p className="font-medium">{person.full_name}</p>
            <p className="text-sm text-zinc-500">
              {person.job_title ?? "—"}
              {person.department && ` · ${person.department.name}`}
              {person.department?.business_unit &&
                ` · ${person.department.business_unit.name}`}
              {person.department?.business_unit?.country &&
                ` · ${person.department.business_unit.country.name}`}
            </p>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="flex justify-between text-sm">
          
           <a href={`?q=${q}&page=${Math.max(0, currentPage - 1)}`}
            className={
              currentPage === 0
                ? "pointer-events-none opacity-40"
                : "underline"
            }
          >
            Previous
          </a>
          <span>
            Page {currentPage + 1} of {totalPages}
          </span>
          
           <a href={`?q=${q}&page=${Math.min(totalPages - 1, currentPage + 1)}`}
            className={
              currentPage >= totalPages - 1
                ? "pointer-events-none opacity-40"
                : "underline"
            }
          >
            Next
          </a>
        </div>
      )}
    </div>
  );
}