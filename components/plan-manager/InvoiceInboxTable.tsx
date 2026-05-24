import Link from "next/link";

import { MapAbleStatusBadge } from "@/components/shared/MapAbleModuleUi";

export function InvoiceInboxTable({
  invoices,
}: {
  invoices: {
    id: string;
    status: string;
    totalCents: number;
    inboxStatus?: string;
    organisation?: { name: string } | null;
  }[];
}) {
  if (invoices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No invoices in your inbox.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Plan manager invoice inbox</caption>
        <thead>
          <tr className="border-b">
            <th scope="col" className="py-3 pr-4">Provider</th>
            <th scope="col" className="py-3 pr-4">Amount</th>
            <th scope="col" className="py-3 pr-4">Status</th>
            <th scope="col" className="py-3">Review</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-b">
              <td className="py-4 pr-4">{inv.organisation?.name ?? "—"}</td>
              <td className="py-4 pr-4">
                ${(inv.totalCents / 100).toFixed(2)}
              </td>
              <td className="py-4 pr-4">
                <MapAbleStatusBadge
                  status={inv.inboxStatus ?? inv.status ?? "invoice_pending"}
                />
              </td>
              <td className="py-4">
                <Link
                  href={`/plan-manager/invoices/${inv.id}`}
                  className="min-h-11 inline-flex items-center text-primary underline"
                >
                  Review
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
