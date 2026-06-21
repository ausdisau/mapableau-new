import Link from "next/link";

import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";
import { REVENUE_BUNDLES } from "@/lib/billing-core/bundles";

export const metadata = {
  title: "Pricing | MapAble",
  description:
    "MapAble pilot pricing for providers, plan managers, employers, and API partners.",
};

export default function PricingPage() {
  return (
    <PublicInfoPage
      eyebrow="Pricing"
      title="Pilot pricing for MapAble revenue lanes"
      description="Subscriptions, platform fees, and licensed data packs for pilot partners. Participant platform fees are not mandatory during the pilot."
      ctaLabel="Ask about pilot pricing"
      ctaHref="/contact"
      sections={[
        {
          title: "Subscriptions",
          content: (
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Provider Pro</strong> — advanced matching, unlimited exports, Connect
                payouts. Platform fee applies to participant card checkout (default 10%).
              </li>
              <li>
                <strong>Employer Pro</strong> — extended job posts and hiring tools.
              </li>
              <li>
                <strong>Plan Manager Pro</strong> — AbilityPay workbench with 50 claim pack
                exports per month (3 free on trial).
              </li>
              <li>
                <strong>Marketplace Featured</strong> — boosted listing placement for provider
                marketplace profiles.
              </li>
            </ul>
          ),
        },
        {
          title: "Bundles",
          content: (
            <div className="space-y-4">
              {REVENUE_BUNDLES.map((bundle) => (
                <div key={bundle.id} className="rounded-lg border p-4">
                  <h3 className="font-semibold">{bundle.name}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">{bundle.description}</p>
                  {bundle.pilotPriceLabel && (
                    <p className="mt-2 text-sm font-medium">{bundle.pilotPriceLabel}</p>
                  )}
                  {bundle.subscriptionPlans.length > 0 && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      Includes: {bundle.subscriptionPlans.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ),
        },
        {
          title: "Transaction fees",
          content: (
            <p>
              Completed care shifts, transport trips, and marketplace purchases can generate{" "}
              <code className="text-sm">BillingInvoice</code> drafts with a platform fee (
              <code className="text-sm">BILLING_PLATFORM_FEE_BPS</code>, default 10%). NDIS
              plan-managed invoices are exported to plan managers — never charged via Stripe
              Checkout.
            </p>
          ),
        },
        {
          title: "API & data licensing",
          content: (
            <ul className="list-disc space-y-2 pl-5">
              <li>Developer API pilot — 10,000 calls/month included; overage billed quarterly.</li>
              <li>
                Licensed report packs — national insights, open data, government SLA bundles
                (manual onboarding).
              </li>
            </ul>
          ),
        },
        {
          title: "Billing principles",
          content: (
            <ul className="list-disc space-y-2 pl-5">
              <li>Invoices require evidence and server-side validation.</li>
              <li>Plan manager access requires consent or an agreed organisational link.</li>
              <li>MapAble will not claim NDIS funding approval for a service.</li>
            </ul>
          ),
        },
        {
          title: "Get started",
          content: (
            <p>
              Provider and employer billing:{" "}
              <Link href="/provider/billing" className="underline">
                Provider billing
              </Link>
              ,{" "}
              <Link href="/employer/billing" className="underline">
                Employer billing
              </Link>
              . Plan managers:{" "}
              <Link href="/plan-manager/billing" className="underline">
                Plan Manager billing
              </Link>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
