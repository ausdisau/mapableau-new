import { cn } from "@/app/lib/utils";

export function SafeAreaContainer({
  children,
  className,
  withBottomNav = false,
}: {
  children: React.ReactNode;
  className?: string;
  withBottomNav?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-h-screen",
        withBottomNav && "pb-[calc(4.5rem+env(safe-area-inset-bottom))]",
        "pt-[env(safe-area-inset-top)]",
        className
      )}
    >
      {children}
    </div>
  );
}
