import { QualityBreakdownPanel } from "@/components/provider-quality/QualityBreakdownPanel";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { getProviderOwnQuality } from "@/lib/provider-quality/provider-quality-service";

export default async function ProviderQualityPage() {
  const user = await requireCurrentUser();
  const membership = await prisma.organisationMember.findFirst({
    where: { userId: user.id },
  });
  const profile = membership
    ? await getProviderOwnQuality(membership.organisationId)
    : null;

  return (
    <div className="space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">Your quality signals</h1>
      <QualityBreakdownPanel profile={profile} />
    </div>
  );
}
