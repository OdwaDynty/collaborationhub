import { getFeedPosts } from "@/features/posts/queries";
import { getCommentsForPosts } from "@/features/comments/queries";
import { PostCard } from "@/features/posts/post-card";
import { NewPostForm } from "@/features/posts/new-post-form";
import { createClient } from "@/lib/supabase/server";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("can_post_org_wide, can_post_department")
    .eq("id", user!.id)
    .single();

  const { posts, error } = await getFeedPosts();
  const commentsByPost = await getCommentsForPosts(posts.map((p) => p.id));

  const canPost =
    profile?.can_post_org_wide || profile?.can_post_department;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3 p-6">
      {canPost && (
        <NewPostForm
          permissions={{
            can_post_org_wide: profile!.can_post_org_wide,
            can_post_department: profile!.can_post_department,
          }}
        />
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {!error && posts.length === 0 && (
        <p className="text-sm text-zinc-500">No posts yet. Check back soon.</p>
      )}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          comments={commentsByPost[post.id] ?? []}
        />
      ))}
    </div>
  );
}