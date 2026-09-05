import type { Post } from "@/types/posts";
import type { Comment } from "@/types/comments";
import { CommentList } from "@/features/comments/comment-list";
import { NewCommentForm } from "@/features/comments/new-comment-form";
import { InlineDeleteButton } from "@/features/shared/inline-delete-button";
import { deletePost } from "./actions";
import { createClient } from "@/lib/supabase/server";

const AVATAR_TINTS = [
  { bg: "bg-brand-teal/10", text: "text-brand-teal-ink" },
  { bg: "bg-brand-gold/15", text: "text-brand-gold" },
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function getAvatarTint(name: string) {
  const sum = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_TINTS[sum % AVATAR_TINTS.length];
}

export async function PostCard({
  post,
  comments,
}: {
  post: Post;
  comments: Comment[];
}) {
  // This is a Server Component that fetches its own "who's looking at
  // this?" info directly — a small, deliberate exception to how most
  // pages fetch the user once at the top and pass it down, made here
  // because PostCard is rendered many times per page (once per post),
  // and Supabase's `getUser()` call within one request is cheap and
  // cached, not a real N+1 performance concern.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tint = getAvatarTint(post.author.full_name);
  const isOwnPost = user?.id === post.authorId;

  return (
    // `group` here is what lets InlineDeleteButton's hover-to-reveal
    // styling work — it watches for hover on this specific <article>.
    <article className="group rounded-xl border border-hairline bg-white p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-heading text-xs font-semibold ${tint.bg} ${tint.text}`}
        >
          {getInitials(post.author.full_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-heading text-sm font-semibold text-ink">
              {post.author.full_name}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-ink/50">
                {post.scope === "organization"
                  ? "Organization"
                  : post.department?.name ?? "Department"}
              </span>
              {isOwnPost && (
               <InlineDeleteButton
                  deleteAction={deletePost}
                     args={[post.id]}
                     successMessage="Post deleted"
                 />
              )}
            </div>
          </div>
          <time className="text-xs text-ink/40">
            {new Date(post.created_at).toLocaleString()}
          </time>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm text-ink/80">
        {post.content}
      </p>

      <CommentList comments={comments} />
      <NewCommentForm postId={post.id} />
    </article>
  );
}