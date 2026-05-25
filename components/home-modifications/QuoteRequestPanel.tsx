import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";

export function QuoteRequestPanel({
  quotes,
}: {
  quotes: { id: string; title: string; status: string; totalCents: number }[];
}) {
  return (
    <MapAbleCard title="Quote requests">
      {quotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No quotes requested yet.</p>
      ) : (
        <ul className="space-y-2">
          {quotes.map((q) => (
            <li key={q.id} className="rounded-lg border px-4 py-3 text-sm">
              {q.title} · {q.status} · ${(q.totalCents / 100).toFixed(2)}
            </li>
          ))}
        </ul>
      )}
    </MapAbleCard>
  );
}
