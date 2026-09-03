import { getChannels } from "@/features/channels/queries";
import { ChannelList } from "@/features/channels/channel-list";
import { NewChannelForm } from "@/features/channels/new-channel-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ChannelsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("can_create_channels")
    .eq("id", user!.id)
    .single();

  const { channels, error } = await getChannels();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-6">
      {profile?.can_create_channels && <NewChannelForm />}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && <ChannelList channels={channels} />}
    </div>
  );
}