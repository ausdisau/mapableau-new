import { BillingDashboard } from "@/components/billing/BillingDashboard";

export const metadata = {
  title: "Billing | MapAble",
  description: "Participant billing dashboard — invoices, NDIS funding, and payments",
};

export default function BillingPage() {
  return <BillingDashboard />;
}
