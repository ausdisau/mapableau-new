import Link from "next/link";

import { AuraDisclaimerBanner } from "@/components/aura/AuraDisclaimerBanner";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminAuraOutcomesPage() {
  await requirePermission("admin:dashboard");
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <p>
        <Link href="/admin/aura" className="text-sm underline">
          Back to AURA admin
        </Link>
      </p>
      <h1 className="font-heading text-xl font-bold">Outcomes</h1>
      <AuraDisclaimerBanner scope="admin" />
    </div>
  );
}
