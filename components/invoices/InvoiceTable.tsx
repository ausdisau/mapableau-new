import Link from "next/link";

import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";

type Row = {
  id: string;
  invoiceNumber?: string | null;
  status: string;
  totalCents: number;
  createdAt: string;
  organisation?: { name: string } | null;
};

export function InvoiceTable({
  invoices,
  basePath,
}: {
  invoices: Row[];
  basePath: string;
}) {
  if (invoices.length === 0) {
    return <p className="text-muted-foreground">No invoices yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead>
          <tr className="border-b">
            <th scope="col" className="py-2 pr-4 font-medium">
              Invoice
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Status
            </th>
            <th scope="col" className="py-2 pr-4 font-medium text-right">
              Total
            </th>
            <th scope="col" className="py-2 font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-b border-border/50">
              <td className="py-3 pr-4">
                <Link
                  href={`${basePath}/${inv.id}`}
                  className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {inv.invoiceNumber ?? inv.id.slice(0, 8)}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {new Date(inv.createdAt).toLocaleDateString()}
                </p>
              </td>
              <td className="py-3 pr-4">
                <InvoiceStatusBadge status={inv.status} />
              </td>
              <td className="py-3 pr-4 text-right font-medium">
                ${(inv.totalCents / 100).toFixed(2)}
              </td>
              <td className="py-3">
                <Link
                  href={`${basePath}/${inv.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
