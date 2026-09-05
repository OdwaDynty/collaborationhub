import { Cake } from "lucide-react";
import { getUpcomingBirthdays, getWishesForProfiles } from "@/features/birthdays/queries";
import { NewWishForm } from "@/features/birthdays/new-wish-form";

function formatMonthDay(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default async function BirthdaysPage() {
  const { birthdays, error } = await getUpcomingBirthdays();

  const today = birthdays.filter((b) => b.days_until === 0);
  const upcoming = birthdays.filter((b) => b.days_until > 0);

  const wishesByProfile = await getWishesForProfiles(today.map((b) => b.id));

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && (
        <>
          {today.length > 0 && (
            <section className="space-y-3">
              {today.map((b) => {
                const wishes = wishesByProfile[b.id] ?? [];
                return (
                  <div
                    key={b.id}
                    className="rounded-xl border-[1.5px] border-brand-gold bg-brand-teal-ink p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-gold font-heading text-base font-semibold text-white">
                        {getInitials(b.full_name)}
                      </div>
                      <div>
                        <p className="font-heading text-base font-semibold text-white">
                          {b.full_name}
                        </p>
                        <p className="text-sm font-medium text-brand-gold-light">
                          Celebrating today
                        </p>
                      </div>
                    </div>

                    {wishes.length > 0 && (
                      <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
                        {wishes.map((w) => (
                          <p key={w.id} className="text-sm text-white/90">
                            <span className="font-semibold text-white">
                              {w.author.full_name}:
                            </span>{" "}
                            {w.content}
                          </p>
                        ))}
                      </div>
                    )}

                    <NewWishForm profileId={b.id} />
                  </div>
                );
              })}
            </section>
          )}

          <section>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/40">
              Upcoming (next 30 days)
            </h2>
            {/* Matches the same "icon + headline + sentence" pattern as
                the other empty states, instead of the old single gray
                line — the whole point of this pass is consistency. */}
            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-hairline bg-white py-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-teal/10">
                  <Cake className="h-4 w-4 text-brand-teal-ink" />
                </div>
                <p className="text-sm text-ink/50">
                  No birthdays in the next 30 days.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-white">
                {upcoming.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-teal/10 font-heading text-xs font-semibold text-brand-teal-ink">
                      {getInitials(b.full_name)}
                    </div>
                    <span className="flex-1 text-sm font-medium text-ink">
                      {b.full_name}
                    </span>
                    <span className="text-sm text-ink/40">
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