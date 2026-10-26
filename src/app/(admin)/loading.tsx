export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-6 h-6 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" aria-hidden />
        <b className="text-2xl font-bold">Loading…</b>
      </div>
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col gap-3">
        {[90, 100, 75, 95, 85].map((w, i) => (
          <div
            key={i}
            className="h-10 rounded-xl bg-neutral-100 animate-pulse"
            style={{ width: `${w}%` }}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}
