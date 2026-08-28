import type { Post } from "@/types/posts";
import type { Comment } from "@/types/comments";
import { CommentList } from "@/features/comments/comment-list";
import { NewCommentForm } from "@/features/comments/new-comment-form";

export function PostCard({
  post,
  comments,
}: {
  post: Post;
  comments: Comment[];
}) {
  return (
    <article className="rounded border p-4">
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {post.author.full_name}
        </span>
        <span>
          {post.scope === "organization"
            ? "Organization"
            : post.department?.name ?? "Department"}
        </span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
        {post.content}
      </p>
      <time className="mt-2 block text-xs text-zinc-400">
        {new Date(post.created_at).toLocaleString()}
      </time>

      <CommentList comments={comments} />
      <NewCommentForm postId={post.id} />
    </article>
  );
}