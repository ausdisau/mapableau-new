export function InvoiceTotalsTable({
  subtotalCents,
  taxCents,
  totalCents,
  ndisClaimableCents,
  participantGapCents,
}: {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  ndisClaimableCents: number;
  participantGapCents: number;
}) {
  const fmt = (c: number) => `$${(c / 100).toFixed(2)}`;

  return (
    <div className="space-y-4">
      <table className="w-full text-sm">
        <caption className="sr-only">Invoice amounts</caption>
        <tbody>
          <tr>
            <th scope="row" className="p-2 text-left font-medium">
              Subtotal
            </th>
            <td className="p-2 text-right">{fmt(subtotalCents)}</td>
          </tr>
          <tr>
            <th scope="row" className="p-2 text-left font-medium">
              GST
            </th>
            <td className="p-2 text-right">{fmt(taxCents)}</td>
          </tr>
          <tr className="border-t font-semibold">
            <th scope="row" className="p-2 text-left">
              Total
            </th>
            <td className="p-2 text-right">{fmt(totalCents)}</td>
          </tr>
        </tbody>
      </table>
      <div className="rounded-lg border p-4 text-sm">
        <p>
          <strong>NDIS claimable:</strong> {fmt(ndisClaimableCents)} — amount
          that may be claimed from your NDIS plan (subject to plan rules).
        </p>
        <p className="mt-2">
          <strong>You may pay:</strong> {fmt(participantGapCents)} — your
          out-of-pocket or private portion.
        </p>
      </div>
    </div>
  );
}
