export function CategoryManagerSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando categorias"
      className="mx-auto max-w-5xl animate-pulse motion-reduce:animate-none"
    >
      <div className="space-y-3">
        <div className="h-4 w-20 rounded-full bg-brand-100" />
        <div className="h-9 w-48 rounded-xl bg-stone-200" />
        <div className="h-4 w-80 max-w-full rounded-full bg-stone-200" />
      </div>

      <section className="mt-8 rounded-2xl border border-stone-300 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="size-10 shrink-0 rounded-xl bg-brand-100" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-36 rounded-full bg-stone-200" />
            <div className="h-3 w-64 max-w-full rounded-full bg-stone-100" />
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded-full bg-stone-200" />
            <div className="h-12 rounded-xl bg-stone-200" />
          </div>
          <div className="h-11 w-full rounded-xl bg-brand-100 sm:w-28" />
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-5 py-4">
          <div className="h-4 w-48 max-w-full rounded-full bg-stone-200" />
          <div className="mt-2 h-3 w-72 max-w-full rounded-full bg-stone-100" />
        </div>
        <div className="divide-y divide-stone-100">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 px-5 py-4">
              <div className="size-10 shrink-0 rounded-xl bg-brand-100" />
              <div className="h-4 flex-1 rounded-full bg-stone-200" />
              <div className="size-11 rounded-xl bg-stone-100" />
              <div className="size-11 rounded-xl bg-stone-100" />
            </div>
          ))}
        </div>
      </section>

      <span className="sr-only">Carregando categorias...</span>
    </div>
  );
}
