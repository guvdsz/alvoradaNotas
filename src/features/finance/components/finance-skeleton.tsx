export function FinanceSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando financeiro"
      className="mx-auto max-w-7xl animate-pulse motion-reduce:animate-none"
      aria-busy="true"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="h-4 w-24 rounded-full bg-brand-100" />
          <div className="h-9 w-48 rounded-xl bg-stone-200" />
          <div className="h-4 w-80 max-w-full rounded-full bg-stone-100" />
        </div>
        <div className="h-11 w-full rounded-xl bg-brand-100 sm:w-40" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-stone-300 bg-white p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="h-4 w-28 rounded-full bg-stone-200" />
                <div className="h-8 w-36 max-w-full rounded-lg bg-stone-200" />
              </div>
              <div className="size-10 rounded-xl bg-stone-100" />
            </div>
            <div className="mt-4 h-3 w-32 rounded-full bg-stone-100" />
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="h-72 rounded-2xl border border-stone-300 bg-white sm:h-96" />
        <div className="h-72 rounded-2xl border border-stone-300 bg-white sm:h-96" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="h-64 rounded-2xl border border-stone-300 bg-white sm:h-80" />
        <div className="h-64 rounded-2xl border border-stone-300 bg-white sm:h-80" />
      </div>
      <span className="sr-only">Carregando dados financeiros...</span>
    </div>
  );
}
