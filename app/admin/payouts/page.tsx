import { AdminPayoutsClient } from "@/components/admin/AdminPayoutsClient";
import { requireAdminScope } from "@/lib/auth/guards";

export const metadata = { title: "Payouts | MapAble Admin" };

export default async function AdminPayoutsPage() {
  await requireAdminScope("billing:manage_payouts");
  return <AdminPayoutsClient />;
}
