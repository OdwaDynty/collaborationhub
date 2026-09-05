export default function MessagesLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-6">
      <div className="h-6 w-28 animate-pulse rounded bg-hairline" />
      <div className="divide-y divide-hairline rounded-xl border border-hairline bg-white">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-hairline" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-hairline" />
              <div className="h-3 w-48 animate-pulse rounded bg-hairline" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}