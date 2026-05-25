type Line = {
  id: string;
  description: string;
  plainDescription?: string | null;
  serviceDate: string;
  quantity: number | string;
  unitAmountCents: number;
  totalAmountCents: number;
  supportItemCode?: string | null;
  claimableByNdis?: boolean;
};

export function InvoiceLineItems({
  lines,
  audience = "participant",
}: {
  lines: Line[];
  audience?: "participant" | "provider";
}) {
  return (
    <table className="w-full text-left text-sm" aria-label="Invoice line items">
      <thead>
        <tr className="border-b">
          <th scope="col" className="py-2 pr-4 font-medium">
            Description
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            Date
          </th>
          <th scope="col" className="py-2 pr-4 font-medium text-right">
            Qty
          </th>
          <th scope="col" className="py-2 font-medium text-right">
            Amount
          </th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => (
          <tr key={line.id} className="border-b border-border/50">
            <td className="py-3 pr-4">
              <span className="font-medium">
                {audience === "participant" && line.plainDescription
                  ? line.plainDescription
                  : line.description}
              </span>
              {line.supportItemCode ? (
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  NDIS item {line.supportItemCode}
                  {line.claimableByNdis ? " · NDIS claimable" : ""}
                </p>
              ) : null}
            </td>
            <td className="py-3 pr-4 text-muted-foreground">
              {new Date(line.serviceDate).toLocaleDateString()}
            </td>
            <td className="py-3 pr-4 text-right">{String(line.quantity)}</td>
            <td className="py-3 text-right font-medium">
              ${(line.totalAmountCents / 100).toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
