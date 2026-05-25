export function QuoteComparisonTable({
  comparison,
}: {
  comparison: {
    responses: { id: string; organisationId: string; totalCents: number }[];
    disclaimer: string;
  };
}) {
  return (
    <section className="space-y-2">
      <h2 className="font-heading text-lg font-semibold">Compare quotes</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2 text-left">Provider</th>
            <th className="py-2 text-left">Total</th>
          </tr>
        </thead>
        <tbody>
          {comparison.responses.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="py-2 font-mono text-xs">{r.organisationId.slice(0, 8)}…</td>
              <td className="py-2">${(r.totalCents / 100).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground">{comparison.disclaimer}</p>
    </section>
  );
}
