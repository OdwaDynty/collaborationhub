import type { Comment } from "@/types/comments";
import { InlineDeleteButton } from "@/features/shared/inline-delete-button";
import { deleteComment } from "./actions";
import { createClient } from "@/lib/supabase/server";

export async function CommentList({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <ul className="mt-3 space-y-2 border-t pt-3">
      {comments.map((comment) => (
        // `group` again, same hover-reveal pattern as PostCard.
        <li key={comment.id} className="group flex items-start justify-between gap-2 text-sm">
          <p>
            <span className="font-medium">{comment.author.full_name}</span>{" "}
            <span className="text-zinc-700 dark:text-zinc-300">
              {comment.content}
            </span>
          </p>
          {user?.id === comment.authorId && (
           <InlineDeleteButton
               deleteAction={deleteComment}
               args={[comment.id]}
               successMessage="Comment deleted"
            />
          )}
        </li>
      ))}
    </ul>
  );
}