import { getFeedPosts } from "@/features/posts/queries";
import { PostCard } from "@/features/posts/post-card";

export default async function FeedPage() {
  const { posts, error } = await getFeedPosts();

  if (error) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-zinc-500">
          No posts yet. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3 p-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}