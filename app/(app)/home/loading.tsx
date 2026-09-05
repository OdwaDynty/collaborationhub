// Next.js automatically shows this while app/(app)/home/page.tsx is
// still fetching its data on the server. No import or manual trigger
// needed — the filename "loading.tsx" is a Next.js convention.
export default function HomeLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-6">
      {/* Mimics the shape of the post composer */}
      <div className="h-32 animate-pulse rounded-xl border border-hairline bg-white" />
      {/* Mimics two post cards */}
      <div className="h-24 animate-pulse rounded-xl border border-hairline bg-white" />
      <div className="h-24 animate-pulse rounded-xl border border-hairline bg-white" />
    </div>
  );
}