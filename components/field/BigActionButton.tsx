import Link from "next/link";

import { cn } from "@/app/lib/utils";

export function BigActionButton({
  href,
  label,
  variant = "primary",
  onClick,
  type = "link",
}: {
  href?: string;
  label: string;
  variant?: "primary" | "secondary";
  onClick?: () => void;
  type?: "link" | "button";
}) {
  const className = cn(
    "flex min-h-14 w-full items-center justify-center rounded-xl px-6 text-base font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    variant === "primary"
      ? "bg-primary text-primary-foreground"
      : "border-2 border-primary bg-transparent text-primary"
  );

  if (type === "button" && onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {label}
      </button>
    );
  }

  return (
    <Link href={href ?? "#"} className={className}>
      {label}
    </Link>
  );
}
