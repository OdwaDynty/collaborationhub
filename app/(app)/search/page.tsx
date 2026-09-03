import Link from "next/link";
import { search } from "@/features/search/queries";
import { MessageButton } from "@/features/direct-messages/message-button";
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
      <form className="flex gap-2 rounded-xl border-[1.5px] border-brand-teal bg-white p-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search people, posts, announcements, channels..."
          className="flex-1 rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-brand-teal focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-teal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-teal-ink"
        >
          Search
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && q.trim() && totalCount === 0 && (
        <p className="text-sm text-ink/50">No results for &quot;{q}&quot;.</p>
      )}

      {results.people.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/40">
            People
          </h2>
          <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-white">
            {results.people.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 p-3">
                <Link href={`/people/${p.id}`} className="min-w-0 hover:underline">
                  <p className="font-heading text-sm font-semibold text-ink">
                    {p.full_name}
                  </p>
                  {p.job_title && <p className="text-sm text-ink/50">{p.job_title}</p>}
                </Link>
                {p.id !== user.id && <MessageButton profileId={p.id} />}
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.posts.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/40">
            Feed posts
          </h2>
          <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-white">
            {results.posts.map((post) => (
              <li key={post.id} className="p-3 text-sm">
                <Link href="/home" className="hover:underline">
                  <p className="line-clamp-2 text-ink/80">{post.content}</p>
                  <time className="text-xs text-ink/40">
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
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/40">
            Announcements
          </h2>
          <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-white">
            {results.announcements.map((a) => (
              <li key={a.id} className="p-3 text-sm">
                <Link href="/announcements" className="hover:underline">
                  <p className="font-heading font-semibold text-ink">{a.title}</p>
                  <time className="text-xs text-ink/40">
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
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/40">
            Channels
          </h2>
          <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-white">
            {results.channels.map((c) => (
              <li key={c.id} className="p-3 text-sm">
                <Link href={`/channels/${c.id}`} className="hover:underline">
                  <p className="font-heading font-semibold text-ink"># {c.name}</p>
                  {c.description && <p className="text-ink/50">{c.description}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}