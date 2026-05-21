import { AdminBillingConsole } from "@/components/billing/AdminBillingConsole";

export const metadata = {
  title: "Admin billing | MapAble",
  description: "Admin billing console for invoices, disputes, and exports",
};

export default function AdminBillingPage() {
  return <AdminBillingConsole />;
}
