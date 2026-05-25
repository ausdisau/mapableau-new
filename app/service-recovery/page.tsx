import Link from "next/link";

import { RecoveryDashboard } from "@/components/service-recovery/RecoveryDashboard";
import { requireAuth } from "@/lib/auth/guards";
import { listRecoveryCases } from "@/lib/service-recovery/recovery-case-service";

export const metadata = { title: "Service recovery | MapAble" };

export default async function ServiceRecoveryPage() {
  const user = await requireAuth();
  let cases: Awaited<ReturnType<typeof listRecoveryCases>> = [];
  try {
    cases = await listRecoveryCases({ participantId: user.id });
  } catch {
    cases = [];
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <header>
        <h1 className="font-heading text-2xl font-bold">Service recovery</h1>
        <p className="mt-2 text-muted-foreground">
          When something changes with your booking, we help you find backup options in plain language.
        </p>
      </header>
      <RecoveryDashboard cases={cases} />
    </div>
  );
}
