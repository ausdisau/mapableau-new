import Link from "next/link";

import { AuraDisclaimerBanner } from "@/components/aura/AuraDisclaimerBanner";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ProviderAuraIncidentsPage() {
  await requirePermission("admin:command-centre:read");
  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <p>
        <Link href="/provider/aura" className="text-sm underline">
          Back to AURA
        </Link>
      </p>
      <h1 className="font-heading text-xl font-bold">Incidents</h1>
      <AuraDisclaimerBanner scope="provider" />
    </div>
  );
}
