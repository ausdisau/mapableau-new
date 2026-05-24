import { WorkerVerifyActions } from "@/components/phase3/WorkerVerifyActions";
import { WorkerVerificationPanel } from "@/components/verification/WorkerVerificationPanel";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminWorkerDetailPage({
  params,
}: {
  params: Promise<{ workerId: string }>;
}) {
  await requireAdmin();
  const { workerId } = await params;
  const profile = await prisma.workerProfile.findUnique({ where: { id: workerId } });
  if (!profile) return <p>Not found</p>;
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">{profile.displayName}</h1>
      <p>Verification: {profile.verificationStatus}</p>
      <WorkerVerificationPanel
        workerId={workerId}
        initialContractorAbn={profile.contractorAbn}
      />
      <WorkerVerifyActions workerId={workerId} />
    </div>
  );
}
