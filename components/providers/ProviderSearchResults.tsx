import { ProviderResultCard } from "@/components/providers/ProviderResultCard";

export type ProviderResult = {
  id: string;
  name: string;
  suburb?: string;
  distanceKm?: number | null;
  sponsored?: boolean;
  categories?: string[];
};

export function ProviderSearchResults({
  results,
  emptyMessage = "No providers match your search.",
}: {
  results: ProviderResult[];
  emptyMessage?: string;
}) {
  if (results.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Provider results">
      {results.map((p) => (
        <li key={p.id}>
          <ProviderResultCard
            name={p.name}
            suburb={p.suburb}
            distanceKm={p.distanceKm}
            sponsored={p.sponsored}
          />
        </li>
      ))}
    </ul>
  );
}
