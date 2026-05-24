import Link from "next/link";

import { ProviderOnboardingClient } from "@/app/provider/onboarding/ProviderOnboardingClient";
import { requireAuth } from "@/lib/auth/guards";
import { roleLabel } from "@/lib/auth/roles";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Provider onboarding | MapAble" };

export default async function ProviderOnboardingPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0] ?? null;
  const org = organisationId
    ? await prisma.organisation.findUnique({
        where: { id: organisationId },
        select: { abn: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <h1 className="font-heading text-2xl font-bold">Provider onboarding</h1>
      <p className="text-muted-foreground">
        Signed in as {roleLabel(user.primaryRole)}. Complete your organisation ABN
        verification, then submit your verification case for MapAble admin review.
      </p>
      <ul className="list-disc space-y-2 pl-6 text-sm">
        <li>Organisation profile and ABN (ABR lookup below)</li>
        <li>NDIS registration claim (manual verification)</li>
        <li>Insurance documentation</li>
        <li>Worker credentials and optional contractor ABN</li>
      </ul>
      <ProviderOnboardingClient
        organisationId={organisationId}
        initialAbn={org?.abn}
      />
      <Link
        href="/dashboard"
        className="inline-block text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
