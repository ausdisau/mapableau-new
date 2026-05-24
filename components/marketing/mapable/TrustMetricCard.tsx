import { cn } from "@/app/lib/utils";

export function TrustMetricCard({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm",
        className,
      )}
    >
      <p className="mapable-display text-4xl font-bold text-mapable-blue sm:text-5xl">
        {value}
      </p>
      <p className="mapable-soft mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
        {label}
      </p>
    </div>
  );
}
