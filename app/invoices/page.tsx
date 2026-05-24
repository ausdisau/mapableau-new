import Link from "next/link";

import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { Badge } from "@/components/ui/badge";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { mapableEyebrowBadgeClass, mapablePageContainerClass } from "@/lib/brand/styles";
import { listInvoicesForUser } from "@/lib/billing/invoice-service";

export const metadata = {
  title: "My invoices | MapAble",
};

export default async function InvoicesPage() {
  const user = await requireCurrentUser();
  const invoices = await listInvoicesForUser(user);

  return (
    <div className={mapablePageContainerClass}>
      <div className="mx-auto max-w-4xl py-8">
        <Badge variant="outline" className={mapableEyebrowBadgeClass}>
          Billing
        </Badge>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">
          Your <span className="text-primary">invoices</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          View, approve, and pay invoices for your supports. MapAble is the record
          of what you owe; card payments go through Stripe.
        </p>
        <div className="mt-10">
          <InvoiceTable
            invoices={invoices.map((i) => ({
              id: i.id,
              invoiceNumber: i.invoiceNumber,
              status: i.status,
              totalCents: i.totalCents,
              createdAt: i.createdAt.toISOString(),
            }))}
            basePath="/invoices"
          />
        </div>
        <p className="mt-6 text-sm">
          <Link href="/dashboard" className="text-primary hover:underline">
            Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
