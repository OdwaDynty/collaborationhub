import { getConversations } from "@/features/direct-messages/queries";
import { ConversationList } from "@/features/direct-messages/conversation-list";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { conversations, error } = await getConversations();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3 p-6">
      <h1 className="font-medium">Messages</h1>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {!error && <ConversationList conversations={conversations} />}
    </div>
  );
}