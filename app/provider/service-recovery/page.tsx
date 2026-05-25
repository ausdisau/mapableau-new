import { RecoveryDashboard } from "@/components/service-recovery/RecoveryDashboard";
import { getCurrentUser, requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { listRecoveryCases } from "@/lib/service-recovery/recovery-case-service";

export default async function ProviderServiceRecoveryPage() {
  const user = await requireCurrentUser();
  const membership = await prisma.organisationMember.findFirst({
    where: { userId: user.id },
  });

  let cases: Awaited<ReturnType<typeof listRecoveryCases>> = [];
  try {
    if (membership) {
      cases = await listRecoveryCases({
        organisationId: membership.organisationId,
      });
    }
  } catch {
    cases = [];
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">Service recovery</h1>
      <RecoveryDashboard cases={cases} />
    </div>
  );
}
