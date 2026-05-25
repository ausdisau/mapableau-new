import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";

export function QuoteComparisonTable({
  quotes,
}: {
  quotes: {
    id: string;
    title: string;
    totalCents: number;
    status: string;
    breakdown?: unknown;
    note?: string;
  }[];
}) {
  return (
    <MapAbleCard
      title="Quote comparison"
      description="Clear cost breakdowns. Compare with the participant before accepting."
    >
      {quotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No quotes to compare.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <caption className="sr-only">Home modification quote comparison</caption>
            <thead>
              <tr className="border-b">
                <th scope="col" className="py-2 pr-4">Quote</th>
                <th scope="col" className="py-2 pr-4">Total</th>
                <th scope="col" className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id} className="border-b">
                  <td className="py-3 pr-4">{q.title}</td>
                  <td className="py-3 pr-4">${(q.totalCents / 100).toFixed(2)}</td>
                  <td className="py-3">{q.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </MapAbleCard>
  );
}
