import { AbnLookupField } from "@/components/verification/AbnLookupField";
import { ProviderVerificationClient } from "@/components/verification/ProviderVerificationClient";
import { requireAuth } from "@/lib/auth/guards";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Verification | MapAble" };

export default async function DashboardVerificationPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];

  if (!organisationId) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Verification</h1>
        <p className="text-muted-foreground">
          You are not linked to an organisation. Contact your coordinator to complete
          provider verification.
        </p>
      </div>
    );
  }

  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
    select: { id: true, name: true, abn: true, verificationStatus: true },
  });

  const latestCase = await prisma.providerVerificationCase.findFirst({
    where: { organisationId },
    orderBy: { createdAt: "desc" },
    include: { checks: { where: { checkType: "abn" }, take: 1 } },
  });

  const abnCheck = latestCase?.checks[0];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Verification</h1>
        <p className="text-muted-foreground">
          {org?.name} — verify your ABN and submit your provider verification case.
        </p>
      </header>
      <AbnLookupField organisationId={organisationId} initialAbn={org?.abn} />
      <ProviderVerificationClient
        organisationId={organisationId}
        caseId={latestCase?.id ?? null}
        caseStatus={latestCase?.status ?? null}
        abnCheckStatus={abnCheck?.status ?? null}
        abnNotesJson={abnCheck?.notes ?? null}
      />
    </div>
  );
}
