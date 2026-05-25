import { cn } from "@/app/lib/utils";

export function PageContainer({
  children,
  className,
  narrow,
}: {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-full overflow-x-hidden px-4 py-4 md:py-6",
        narrow ? "max-w-lg" : "max-w-6xl",
        className
      )}
    >
      {children}
    </div>
  );
}
