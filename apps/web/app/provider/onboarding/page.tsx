import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { roleLabel } from "@/lib/auth/roles";

export const metadata = { title: "Provider onboarding | MapAble" };

export default async function ProviderOnboardingPage() {
  const user = await requireAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <h1 className="font-heading text-2xl font-bold">Provider onboarding</h1>
      <p className="text-muted-foreground">
        Signed in as {roleLabel(user.primaryRole)}. Phase 1 uses manual
        verification by MapAble admins. Submit your organisation details through
        your coordinator or contact MapAble support.
      </p>
      <ul className="list-disc space-y-2 pl-6 text-sm">
        <li>Organisation profile and ABN</li>
        <li>NDIS registration claim (manual verification)</li>
        <li>Insurance documentation (placeholder)</li>
        <li>Incident and complaint process (Phase 2)</li>
      </ul>
      <Link
        href="/dashboard"
        className="inline-block text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
