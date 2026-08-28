import { getUpcomingBirthdays } from "@/features/birthdays/queries";

function formatMonthDay(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

export default async function BirthdaysPage() {
  const { birthdays, error } = await getUpcomingBirthdays();

  const today = birthdays.filter((b) => b.days_until === 0);
  const upcoming = birthdays.filter((b) => b.days_until > 0);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && (
        <>
          <section>
            <h2 className="text-sm font-semibold text-zinc-500">
              Today
            </h2>
            {today.length === 0 ? (
              <p className="mt-1 text-sm text-zinc-400">
                No birthdays today.
              </p>
            ) : (
              <ul className="mt-2 space-y-1">
                {today.map((b) => (
                  <li key={b.id} className="text-sm font-medium">
                    {b.full_name}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold text-zinc-500">
              Upcoming (next 30 days)
            </h2>
            {upcoming.length === 0 ? (
              <p className="mt-1 text-sm text-zinc-400">
                No upcoming birthdays.
              </p>
            ) : (
              <ul className="mt-2 divide-y rounded border">
                {upcoming.map((b) => (
                  <li
                    key={b.id}
                    className="flex justify-between p-3 text-sm"
                  >
                    <span>{b.full_name}</span>
                    <span className="text-zinc-500">
                      {formatMonthDay(b.birthday)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}