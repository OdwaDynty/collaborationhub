import type { Post } from "@/types/posts";
import type { Comment } from "@/types/comments";
import { CommentList } from "@/features/comments/comment-list";
import { NewCommentForm } from "@/features/comments/new-comment-form";

// Deterministic avatar tint so the same person always gets the same
// color, without needing to store a color per profile.
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

export function PostCard({
  post,
  comments,
}: {
  post: Post;
  comments: Comment[];
}) {
  const tint = getAvatarTint(post.author.full_name);

  return (
    <article className="rounded-xl border border-hairline bg-white p-4">
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
            <span className="shrink-0 text-xs text-ink/50">
              {post.scope === "organization"
                ? "Organization"
                : post.department?.name ?? "Department"}
            </span>
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