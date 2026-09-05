export function ProductFormSkeleton() {
  return (
    <div
      aria-label="Carregando formulário do produto"
      aria-busy="true"
      role="status"
      className="mx-auto max-w-4xl animate-pulse motion-reduce:animate-none"
    >
      <div className="h-11 w-36 rounded-lg bg-stone-200" />
      <div className="mt-6 h-9 w-56 rounded-lg bg-stone-200" />
      <div className="mt-3 h-4 w-80 max-w-full rounded bg-stone-100" />

      <div className="mt-8 space-y-6">
        {[4, 2, 1].map((fieldCount, sectionIndex) => (
          <section
            key={sectionIndex}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-stone-100" />
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-stone-200" />
                <div className="h-3 w-52 max-w-full rounded bg-stone-100" />
              </div>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {Array.from({ length: fieldCount }).map((_, fieldIndex) => (
                <div key={fieldIndex} className="space-y-2">
                  <div className="h-4 w-24 rounded bg-stone-100" />
                  <div className="h-12 rounded-xl bg-stone-100" />
                </div>
              ))}
            </div>
          </section>
        ))}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <div className="h-11 rounded-xl bg-stone-200 sm:w-28" />
          <div className="h-11 rounded-xl bg-brand-100 sm:w-44" />
        </div>
      </div>
      <span className="sr-only">Carregando formulário do produto...</span>
    </div>
  );
}
