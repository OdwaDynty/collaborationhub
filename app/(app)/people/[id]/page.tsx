import Link from "next/link";
import { getProfileById } from "@/features/people/queries";
import { MessageButton } from "@/features/direct-messages/message-button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
        <p className="text-sm text-red-600 dark:text-red-400">
          {error ?? "Employee not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-4 p-6">
      <Link href="/people" className="text-xs text-zinc-500 underline">
        ← Back to directory
      </Link>

      <div className="rounded border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-medium">{profile.full_name}</h1>
            <p className="text-sm text-zinc-500">{profile.job_title ?? "—"}</p>
          </div>
          {profile.id !== user.id && <MessageButton profileId={profile.id} />}
        </div>

        <dl className="mt-4 space-y-2 text-sm">
          {profile.department && (
            <div className="flex justify-between border-t pt-2">
              <dt className="text-zinc-500">Department</dt>
              <dd>{profile.department.name}</dd>
            </div>
          )}
          {profile.department?.business_unit && (
            <div className="flex justify-between border-t pt-2">
              <dt className="text-zinc-500">Business unit</dt>
              <dd>{profile.department.business_unit.name}</dd>
            </div>
          )}
          {profile.department?.business_unit?.country && (
            <div className="flex justify-between border-t pt-2">
              <dt className="text-zinc-500">Country</dt>
              <dd>{profile.department.business_unit.country.name}</dd>
            </div>
          )}
          {profile.birthday && (
            <div className="flex justify-between border-t pt-2">
              <dt className="text-zinc-500">Birthday</dt>
              <dd>
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