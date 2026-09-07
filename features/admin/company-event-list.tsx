import { CalendarDays } from "lucide-react";
import type { CompanyEvent } from "@/types/admin";
import { InlineDeleteButton } from "@/features/shared/inline-delete-button";
import { deleteCompanyEvent } from "./actions";

export function CompanyEventList({ events }: { events: CompanyEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-ink/50">No company events yet.</p>;
  }

  return (
    <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-white">
      {events.map((event) => (
        <li key={event.id} className="group flex items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-teal/10">
              <CalendarDays className="h-4 w-4 text-brand-teal-ink" />
            </div>
            <div>
              <p className="font-heading text-sm font-semibold text-ink">{event.title}</p>
              <p className="text-xs text-ink/40">
                {new Date(event.event_date + "T00:00:00").toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                {event.description && ` · ${event.description}`}
              </p>
            </div>
          </div>
          <InlineDeleteButton
            deleteAction={deleteCompanyEvent}
            args={[event.id]}
            successMessage="Event deleted"
          />
        </li>
      ))}
    </ul>
  );
}