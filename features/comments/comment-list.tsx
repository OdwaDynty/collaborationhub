import type { Comment } from "@/types/comments";

export function CommentList({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) return null;

  return (
    <ul className="mt-3 space-y-2 border-t pt-3">
      {comments.map((comment) => (
        <li key={comment.id} className="text-sm">
          <span className="font-medium">{comment.author.full_name}</span>{" "}
          <span className="text-zinc-700 dark:text-zinc-300">
            {comment.content}
          </span>
        </li>
      ))}
    </ul>
  );
}