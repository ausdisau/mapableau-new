import { ProviderBillingClient } from "@/components/billing/ProviderBillingClient";

export const metadata = {
  title: "Provider billing | MapAble",
};

export default function ProviderBillingPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Billing & payouts</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Connect your Stripe account for payouts, manage subscriptions, and review transfers.
      </p>
      <div className="mt-8">
        <ProviderBillingClient />
      </div>
    </>
  );
}
