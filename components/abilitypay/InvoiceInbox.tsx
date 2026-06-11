import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { DuplicateInvoiceWarning } from "./DuplicateInvoiceWarning";
import { formatCents, formatInvoiceStatus } from "./utils";

type InvoiceRow = {
  id: string;
  invoiceNumber: string | null;
  status: string;
  totalCents: number;
  provider?: { legalName: string } | null;
  riskFlags?: { flagType: string }[];
};

export function InvoiceInbox({ invoices }: { invoices: InvoiceRow[] }) {
  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice inbox</CardTitle>
          <CardDescription>No invoices yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => {
        const hasDuplicate = invoice.riskFlags?.some(
          (f) => f.flagType === "duplicate"
        );
        return (
          <Card key={invoice.id} variant="interactive">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">
                  <Link
                    href={`/abilitypay/invoices/${invoice.id}`}
                    className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {invoice.invoiceNumber ?? "Draft invoice"}
                  </Link>
                </CardTitle>
                <Badge variant="outline">{formatInvoiceStatus(invoice.status)}</Badge>
              </div>
              <CardDescription>
                {invoice.provider?.legalName ?? "No provider"} ·{" "}
                {formatCents(invoice.totalCents)}
              </CardDescription>
            </CardHeader>
            {hasDuplicate ? (
              <CardContent className="pt-0">
                <DuplicateInvoiceWarning show />
              </CardContent>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
