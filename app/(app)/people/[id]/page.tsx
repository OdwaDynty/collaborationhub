import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProfileById } from "@/features/people/queries";
import { MessageButton } from "@/features/direct-messages/message-button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { profile, error } = await getProfileById(id);

  if (error || !profile) {
    return (
      <div className="mx-auto w-full max-w-lg p-6">
        <p className="text-sm text-red-600">{error ?? "Employee not found."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-4 p-6">
      <Link
        href="/people"
        aria-label="Back to directory"
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-canvas hover:text-brand-teal"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <div className="rounded-xl border border-hairline bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-teal/10 font-heading text-lg font-semibold text-brand-teal-ink">
              {getInitials(profile.full_name)}
            </div>
            <div>
              <h1 className="font-heading text-lg font-semibold text-ink">
                {profile.full_name}
              </h1>
              <p className="text-sm text-ink/50">{profile.job_title ?? "—"}</p>
            </div>
          </div>
          {profile.id !== user.id && <MessageButton profileId={profile.id} />}
        </div>

        <dl className="mt-5 space-y-2 text-sm">
          {profile.department && (
            <div className="flex justify-between border-t border-hairline pt-2">
              <dt className="text-ink/50">Department</dt>
              <dd className="font-medium text-ink">{profile.department.name}</dd>
            </div>
          )}
          {profile.department?.business_unit && (
            <div className="flex justify-between border-t border-hairline pt-2">
              <dt className="text-ink/50">Business unit</dt>
              <dd className="font-medium text-ink">
                {profile.department.business_unit.name}
              </dd>
            </div>
          )}
          {profile.department?.business_unit?.country && (
            <div className="flex justify-between border-t border-hairline pt-2">
              <dt className="text-ink/50">Country</dt>
              <dd className="font-medium text-ink">
                {profile.department.business_unit.country.name}
              </dd>
            </div>
          )}
          {profile.birthday && (
            <div className="flex justify-between border-t border-hairline pt-2">
              <dt className="text-ink/50">Birthday</dt>
              <dd className="font-medium text-ink">
                {new Date(profile.birthday).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                })}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}