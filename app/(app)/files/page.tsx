import { getFilesForUserChannels } from "@/features/files/queries";
import { getChannels } from "@/features/channels/queries";
import { FileList } from "@/features/files/file-list";
import { UploadForm } from "@/features/files/upload-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function FilesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { channels } = await getChannels();
  const myChannels = channels.filter((c) => c.is_member).map((c) => ({ id: c.id, name: c.name }));

  const { files, error } = await getFilesForUserChannels();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-6">
      <h1 className="font-heading text-lg font-semibold text-ink">Files</h1>

      <UploadForm channels={myChannels} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && <FileList files={files} showChannel />}
    </div>
  );
}