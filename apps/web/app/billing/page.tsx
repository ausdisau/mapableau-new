import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";

export const metadata = {
  title: "Billing | MapAble",
  description: "Participant billing — redirects to invoice and billing centre",
};

export default async function BillingPage() {
  await requireAuth();
  redirect("/dashboard/billing");
}
