import { PriceGuardBadge } from "./PriceGuardBadge";
import { formatCents } from "./utils";

type LineItem = {
  id: string;
  description: string;
  serviceDate: Date | string;
  quantity: unknown;
  unitPriceCents: number;
  totalCents: number;
  supportItemCode: string | null;
  priceLimitStatus?: "pass" | "warning" | "fail" | "unknown" | null;
  budgetCategory?: { name: string } | null;
};

export function InvoiceLineItemTable({ lines }: { lines: LineItem[] }) {
  if (lines.length === 0) {
    return <p className="text-sm text-muted-foreground">No line items.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Invoice line items</caption>
        <thead>
          <tr className="border-b text-left">
            <th scope="col" className="py-2 pr-2">
              Description
            </th>
            <th scope="col" className="py-2 pr-2">
              Date
            </th>
            <th scope="col" className="py-2 pr-2">
              Code
            </th>
            <th scope="col" className="py-2 pr-2">
              Amount
            </th>
            <th scope="col" className="py-2">
              Price check
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id} className="border-b border-border/40">
              <td className="py-2 pr-2">
                {line.description}
                {line.budgetCategory ? (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {line.budgetCategory.name}
                  </span>
                ) : null}
              </td>
              <td className="py-2 pr-2">
                {new Date(line.serviceDate).toLocaleDateString("en-AU")}
              </td>
              <td className="py-2 pr-2">{line.supportItemCode ?? "—"}</td>
              <td className="py-2 pr-2">{formatCents(line.totalCents)}</td>
              <td className="py-2">
                {line.priceLimitStatus ? (
                  <PriceGuardBadge status={line.priceLimitStatus} />
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
