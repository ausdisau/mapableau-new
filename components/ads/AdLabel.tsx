import { cn } from "@/app/lib/utils";

type AdLabelProps = {
  variant?: "sponsored" | "advertisement";
  className?: string;
};

export function AdLabel({ variant = "advertisement", className }: AdLabelProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary",
        className
      )}
      role="note"
    >
      {variant === "sponsored" ? "Sponsored" : "Advertisement"}
    </span>
  );
}
