export function ProductListSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando produtos"
      aria-busy="true"
      className="mx-auto max-w-7xl animate-pulse motion-reduce:animate-none"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="h-4 w-20 rounded bg-brand-100" />
          <div className="h-9 w-44 rounded-lg bg-stone-200" />
          <div className="h-4 w-72 max-w-full rounded bg-stone-100" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="h-11 w-full rounded-xl bg-stone-200 sm:w-32" />
          <div className="h-11 w-full rounded-xl bg-brand-100 sm:w-36" />
        </div>
      </div>
      <section className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="border-b border-stone-100 p-5">
          <div className="h-11 max-w-md rounded-xl bg-stone-100" />
        </div>
        <div className="divide-y divide-stone-100 lg:hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="p-5">
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-stone-200" />
                <div className="h-3 w-28 rounded bg-stone-100" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-stone-50 p-3">
                <div className="h-10 rounded-lg bg-stone-200" />
                <div className="h-10 rounded-lg bg-stone-200" />
              </div>
              <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                <div className="h-11 rounded-xl bg-stone-100" />
                <div className="h-11 w-24 rounded-xl bg-red-50" />
              </div>
            </div>
          ))}
        </div>
        <div className="hidden divide-y divide-stone-100 lg:block">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-6 px-5 py-5">
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-stone-200" />
                <div className="h-3 w-28 rounded bg-stone-100" />
              </div>
              <div className="h-4 w-20 rounded bg-stone-100" />
              <div className="h-4 w-20 rounded bg-stone-100" />
              <div className="h-4 w-24 rounded bg-stone-100" />
              <div className="size-8 rounded-lg bg-stone-100" />
            </div>
          ))}
        </div>
      </section>
      <span className="sr-only">Carregando lista de produtos...</span>
    </div>
  );
}
