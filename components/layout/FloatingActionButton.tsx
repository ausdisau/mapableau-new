import Link from "next/link";

import { cn } from "@/app/lib/utils";

export function FloatingActionButton({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-30 flex min-h-14 min-w-14 items-center justify-center rounded-full bg-secondary px-5 text-sm font-bold text-secondary-foreground shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:bottom-6",
        className
      )}
      aria-label={label}
    >
      <span className="sr-only md:not-sr-only">{label}</span>
      <span className="md:hidden" aria-hidden>
        +
      </span>
    </Link>
  );
}
