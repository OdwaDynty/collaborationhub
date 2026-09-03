export default function ReportsLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div className="h-6 w-24 animate-pulse rounded-lg bg-hairline" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-hairline bg-white p-4">
            <div className="h-3 w-24 animate-pulse rounded bg-hairline" />
            <div className="mt-2 h-7 w-12 animate-pulse rounded bg-hairline" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border-[1.5px] border-hairline bg-white p-5">
        <div className="h-4 w-48 animate-pulse rounded bg-hairline" />
        <div className="mt-6 flex items-end gap-5" style={{ height: 140 }}>
          {[40, 90, 60, 110, 70, 50].map((h, i) => (
            <div
              key={i}
              className="flex-1 animate-pulse rounded-t-md bg-hairline"
              style={{ height: h }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}