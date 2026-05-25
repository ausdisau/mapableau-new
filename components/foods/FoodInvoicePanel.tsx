export function FoodInvoicePanel({
  lines,
}: {
  lines: Array<{ description: string; amountCents: number; costType: string }>;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold">Invoice lines</h2>
      <p className="text-sm text-amber-800">NDIS review required — not marked as claimable.</p>
      <ul className="mt-2 space-y-2">
        {lines.map((l, i) => (
          <li key={i} className="flex justify-between border-b py-2 text-sm">
            <span>
              {l.description}{" "}
              <span className="text-muted-foreground">({l.costType})</span>
            </span>
            <span>${(l.amountCents / 100).toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
