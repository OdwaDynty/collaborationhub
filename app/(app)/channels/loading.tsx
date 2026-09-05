export default function ChannelsLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-6">
      <div className="h-24 animate-pulse rounded-xl border border-hairline bg-white" />
      <div className="divide-y divide-hairline rounded-xl border border-hairline bg-white">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-hairline" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-hairline" />
              <div className="h-3 w-40 animate-pulse rounded bg-hairline" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}