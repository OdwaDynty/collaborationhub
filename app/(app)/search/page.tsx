import Link from "next/link";
import { search } from "@/features/search/queries";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { q = "" } = await searchParams;
  const { results, error } = await search(q);

  const totalCount =
    results.people.length +
    results.posts.length +
    results.announcements.length +
    results.channels.length;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-6">
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search people, posts, announcements, channels..."
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded border px-4 py-2 text-sm">
          Search
        </button>
      </form>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!error && q.trim() && totalCount === 0 && (
        <p className="text-sm text-zinc-500">No results for &quot;{q}&quot;.</p>
      )}

      {results.people.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-medium text-zinc-500">People</h2>
          <ul className="divide-y rounded border">
            {results.people.map((p) => (
              <li key={p.id} className="p-3 text-sm">
                <p className="font-medium">{p.full_name}</p>
                {p.job_title && <p className="text-zinc-500">{p.job_title}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.posts.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-medium text-zinc-500">Feed posts</h2>
          <ul className="divide-y rounded border">
            {results.posts.map((post) => (
              <li key={post.id} className="p-3 text-sm">
                <Link href="/feed" className="hover:underline">
                  <p className="line-clamp-2">{post.content}</p>
                  <time className="text-xs text-zinc-400">
                    {new Date(post.created_at).toLocaleDateString()}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.announcements.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-medium text-zinc-500">Announcements</h2>
          <ul className="divide-y rounded border">
            {results.announcements.map((a) => (
              <li key={a.id} className="p-3 text-sm">
                <Link href="/announcements" className="hover:underline">
                  <p className="font-medium">{a.title}</p>
                  <time className="text-xs text-zinc-400">
                    {new Date(a.created_at).toLocaleDateString()}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.channels.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-medium text-zinc-500">Channels</h2>
          <ul className="divide-y rounded border">
            {results.channels.map((c) => (
              <li key={c.id} className="p-3 text-sm">
                <Link href={`/channels/${c.id}`} className="hover:underline">
                  <p className="font-medium"># {c.name}</p>
                  {c.description && <p className="text-zinc-500">{c.description}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}