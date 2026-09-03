export default function AdminLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-6">
      <div>
        <div className="mb-3 h-5 w-28 animate-pulse rounded bg-hairline" />
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-hairline bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}