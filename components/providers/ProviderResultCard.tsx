import { cn } from "@/app/lib/utils";

export function ProviderResultCard({
  name,
  suburb,
  distanceKm,
  sponsored,
  href = "#",
}: {
  name: string;
  suburb?: string;
  distanceKm?: number | null;
  sponsored?: boolean;
  href?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "block min-h-[4.5rem] rounded-xl border border-border bg-card p-4 hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold">{name}</span>
        {sponsored ? (
          <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Sponsored
          </span>
        ) : null}
      </div>
      {suburb ? (
        <p className="mt-1 text-sm text-muted-foreground">{suburb}</p>
      ) : null}
      {distanceKm != null ? (
        <p className="mt-1 text-sm">
          <span className="font-medium">{distanceKm.toFixed(1)} km</span> away
        </p>
      ) : null}
    </a>
  );
}
