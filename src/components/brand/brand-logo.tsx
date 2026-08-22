import Image from "next/image";

import { cn } from "@/lib/utils/cn";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/alvorada-logo.png"
      alt="Empório Laticínios Alvorada"
      width={152}
      height={152}
      priority
      className={cn("h-auto w-36 object-contain", className)}
    />
  );
}
