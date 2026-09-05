export function MovementManagerSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando movimentações"
      aria-busy="true"
      className="mx-auto max-w-7xl animate-pulse motion-reduce:animate-none"
    >
      <div className="space-y-3">
        <div className="h-4 w-20 rounded-full bg-brand-100" />
        <div className="h-9 w-56 rounded-xl bg-stone-200" />
        <div className="h-4 w-96 max-w-full rounded-full bg-stone-100" />
      </div>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[0.9fr_1.35fr]">
        <MovementFormSkeleton announce={false} />
        <MovementHistorySkeleton announce={false} />
      </div>
      <span className="sr-only">Carregando movimentações...</span>
    </div>
  );
}

export function MovementFormSkeleton({ announce = true }: { announce?: boolean }) {
  return (
    <section
      role={announce ? "status" : undefined}
      aria-label={announce ? "Carregando formulário de movimentação" : undefined}
      aria-busy={announce || undefined}
      aria-hidden={announce ? undefined : true}
      className="animate-pulse rounded-2xl border border-stone-200 bg-white p-5 shadow-sm motion-reduce:animate-none sm:p-6"
    >
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-stone-100" />
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-stone-200" />
          <div className="h-3 w-60 max-w-full rounded bg-stone-100" />
        </div>
      </div>
      <div className="mt-6 h-11 rounded-xl bg-stone-100" />
      <div className="mt-5 space-y-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-4 w-28 rounded bg-stone-100" />
            <div className="h-12 rounded-xl bg-stone-100" />
          </div>
        ))}
        <div className="h-11 rounded-xl bg-brand-100" />
      </div>
      {announce && <span className="sr-only">Carregando formulário...</span>}
    </section>
  );
}

export function MovementHistorySkeleton({ announce = true }: { announce?: boolean }) {
  return (
    <section
      role={announce ? "status" : undefined}
      aria-label={announce ? "Carregando histórico de movimentações" : undefined}
      aria-busy={announce || undefined}
      aria-hidden={announce ? undefined : true}
      className="animate-pulse overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm motion-reduce:animate-none"
    >
      <div className="flex flex-col gap-4 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-stone-200" />
          <div className="h-3 w-56 max-w-full rounded bg-stone-100" />
        </div>
        <div className="h-10 w-full rounded-xl bg-stone-100 sm:w-56" />
      </div>
      <div className="divide-y divide-stone-100">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-start gap-3 p-4 sm:p-5">
            <div className="size-9 shrink-0 rounded-xl bg-stone-100" />
            <div className="flex-1 space-y-3">
              <div className="flex justify-between gap-4">
                <div className="h-4 w-36 rounded bg-stone-200" />
                <div className="h-4 w-16 rounded bg-stone-200" />
              </div>
              <div className="h-3 w-48 max-w-full rounded bg-stone-100" />
              <div className="h-3 w-64 max-w-full rounded bg-stone-100" />
            </div>
          </div>
        ))}
      </div>
      {announce && <span className="sr-only">Carregando histórico...</span>}
    </section>
  );
}
