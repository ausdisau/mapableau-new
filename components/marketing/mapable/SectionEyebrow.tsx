import { cn } from "@/app/lib/utils";

export function SectionEyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mapable-soft text-sm font-semibold uppercase tracking-wide text-mapable-blue",
        className,
      )}
    >
      {children}
    </p>
  );
}
