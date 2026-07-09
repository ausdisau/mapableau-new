import Link from "next/link";

import { StripeCheckoutStatusBanner } from "@/components/billing/StripeCheckoutStatusBanner";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function BillingCentrePage() {
  const user = await requireAuth();

  const [billingInvoiceCount, fundingCount, legacyDraftCount] = await Promise.all([
    prisma.billingInvoice.count({ where: { userId: user.id } }),
    prisma.billingFundingSource.count({ where: { userId: user.id } }),
    prisma.invoice.count({ where: { participantId: user.id } }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">
          Invoice & billing centre
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          View invoices, manage how services are funded, and pay securely with
          Stripe when your funding type allows card payment. Plan-managed NDIS
          invoices are sent to your plan manager — not charged on card.
        </p>
      </header>

      <StripeCheckoutStatusBanner />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CentreCard
          title="Invoices & payments"
          description={
            billingInvoiceCount
              ? `${billingInvoiceCount} billing invoice(s)`
              : "Pay or export invoices"
          }
          href="/dashboard/billing/invoices"
        />
        <CentreCard
          title="Funding sources"
          description={
            fundingCount
              ? `${fundingCount} funding source(s)`
              : "NDIS plan-managed, self-managed, or private pay"
          }
          href="/dashboard/billing/funding"
        />
        <CentreCard
          title="Invoice drafts (legacy)"
          description={
            legacyDraftCount
              ? `${legacyDraftCount} draft record(s)`
              : "Older invoice draft workflow"
          }
          href="/dashboard/billing/legacy"
        />
      </div>

      <section className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Not NDIS claiming.</span>{" "}
          Provider NDIS claim batches are managed in the provider console. This
          centre is for participant invoices and payments only.
        </p>
      </section>
    </div>
  );
}

function CentreCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <span className="mt-3 inline-block text-sm font-medium text-primary">
        Open →
      </span>
    </Link>
  );
}
