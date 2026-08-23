export function DashboardSkeleton() {
  return (
    <div
      className="mx-auto max-w-7xl animate-pulse"
      role="status"
      aria-label="Carregando visão geral"
    >
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="space-y-3">
          <div className="h-4 w-24 rounded-full bg-stone-200" />
          <div className="h-9 w-56 rounded-xl bg-stone-200" />
          <div className="h-4 w-80 max-w-full rounded-full bg-stone-200" />
        </div>
        <div className="flex gap-2">
          <div className="h-11 w-36 rounded-xl bg-stone-200" />
          <div className="h-11 w-40 rounded-xl bg-stone-200" />
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-stone-200/80 bg-white p-5"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="h-4 w-28 rounded-full bg-stone-200" />
                <div className="h-9 w-14 rounded-lg bg-stone-200" />
              </div>
              <div className="size-10 rounded-xl bg-stone-200" />
            </div>
            <div className="mt-4 h-3 w-40 rounded-full bg-stone-100" />
          </div>
        ))}
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-6">
        <div className="h-5 w-48 rounded-full bg-stone-200" />
        <div className="mt-3 h-3 w-64 max-w-full rounded-full bg-stone-100" />
        <div className="mt-6 divide-y divide-stone-100">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 py-4">
              <div className="size-9 rounded-xl bg-stone-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded-full bg-stone-200" />
                <div className="h-3 w-28 rounded-full bg-stone-100" />
              </div>
              <div className="space-y-2">
                <div className="ml-auto h-4 w-16 rounded-full bg-stone-200" />
                <div className="h-3 w-24 rounded-full bg-stone-100" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <span className="sr-only">Carregando visão geral...</span>
    </div>
  );
}
