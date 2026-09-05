import { KeyRound } from "lucide-react";
import type { ApiKey } from "@/types/admin";
import { InlineDeleteButton } from "@/features/shared/inline-delete-button";
import { revokeApiKey } from "./actions";

export function ApiKeyList({ keys }: { keys: ApiKey[] }) {
  if (keys.length === 0) {
    return <p className="text-sm text-ink/50">No API keys have been created yet.</p>;
  }

  return (
    <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-white">
      {keys.map((key) => {
        const isRevoked = !!key.revoked_at;
        return (
          <li key={key.id} className="group flex items-center justify-between gap-3 p-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  isRevoked ? "bg-canvas" : "bg-brand-teal/10"
                }`}
              >
                <KeyRound className={`h-4 w-4 ${isRevoked ? "text-ink/30" : "text-brand-teal-ink"}`} />
              </div>
              <div>
                <p className={`font-heading text-sm font-semibold ${isRevoked ? "text-ink/40 line-through" : "text-ink"}`}>
                  {key.name}
                </p>
                <p className="text-xs text-ink/40">
                  {key.owner_name ?? "No owner assigned"}
                  {key.can_write && !isRevoked && " · Write access"}
                  {isRevoked && ` · Revoked ${new Date(key.revoked_at!).toLocaleDateString()}`}
                </p>
              </div>
            </div>
            {!isRevoked && (
              <InlineDeleteButton
                deleteAction={revokeApiKey}
                args={[key.id]}
                successMessage="Key revoked"
                confirmLabel="Revoke"
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}