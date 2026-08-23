import { LoaderCircle } from "lucide-react";

export default function ProtectedRouteLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[55vh] items-center justify-center"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm font-medium text-stone-600 shadow-sm">
        <LoaderCircle className="size-5 animate-spin text-brand-600" />
        Carregando página...
      </div>
    </div>
  );
}
