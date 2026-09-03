import { getFeedPosts } from "@/features/posts/queries";
import { getCommentsForPosts } from "@/features/comments/queries";
import { PostCard } from "@/features/posts/post-card";
import { NewPostForm } from "@/features/posts/new-post-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("can_post_org_wide, can_post_department")
    .eq("id", user!.id)
    .single();

  const { posts, error } = await getFeedPosts();
  const commentsByPost = await getCommentsForPosts(posts.map((p) => p.id));

  const canPost = profile?.can_post_org_wide || profile?.can_post_department;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-6">
      {canPost ? (
        <NewPostForm
          permissions={{
            can_post_org_wide: profile!.can_post_org_wide,
            can_post_department: profile!.can_post_department,
          }}
        />
      ) : (
        <p className="rounded-xl border border-dashed border-hairline p-4 text-sm text-ink/50">
          You don&apos;t have permission to post yet — contact an
          administrator if this seems wrong.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && posts.length === 0 && (
        <p className="text-sm text-ink/50">
          No posts yet — be the first to share an update.
        </p>
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