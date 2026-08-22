import { cn } from "@/lib/utils/cn";

const sizes = {
  sm: {
    title: "text-lg",
    badge: "rounded-md px-1.5 py-1 text-[0.58rem] tracking-[0.1em]",
  },
  md: {
    title: "text-2xl",
    badge: "rounded-lg px-2 py-1.5 text-[0.68rem] tracking-[0.12em]",
  },
  lg: {
    title: "text-3xl",
    badge: "rounded-lg px-2.5 py-1.5 text-xs tracking-[0.13em]",
  },
} as const;

type BrandWordmarkProps = {
  className?: string;
  size?: keyof typeof sizes;
};

export function BrandWordmark({
  className,
  size = "md",
}: BrandWordmarkProps) {
  return (
    <div
      className={cn("inline-flex w-fit items-center gap-2", className)}
      aria-label="Alvorada Notas"
    >
      <span
        aria-hidden="true"
        className={cn(
          "font-extrabold leading-none tracking-[-0.045em] text-stone-900",
          sizes[size].title,
        )}
      >
        Alvorada
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "bg-brand-600 font-extrabold uppercase leading-none text-white shadow-sm",
          sizes[size].badge,
        )}
      >
        Notas
      </span>
    </div>
  );
}
