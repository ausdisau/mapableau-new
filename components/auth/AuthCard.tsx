import { cn } from "@/app/lib/utils";

export function AuthCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-6 shadow-sm md:p-8",
        className,
      )}
      aria-labelledby="auth-card-heading"
    >
      {children}
    </section>
  );
}
