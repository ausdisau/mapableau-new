import { ProviderBillingDashboard } from "@/components/billing/ProviderBillingDashboard";

export const metadata = {
  title: "Provider billing | MapAble",
  description: "Provider payouts, Stripe Connect, and subscriptions",
};

export default function ProviderBillingPage() {
  return <ProviderBillingDashboard />;
}
