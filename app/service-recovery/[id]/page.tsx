import { notFound } from "next/navigation";

import { RecoveryActionPanel } from "@/components/service-recovery/RecoveryActionPanel";
import { BackupOptionList } from "@/components/service-recovery/BackupOptionList";
import { EscalationTimeline } from "@/components/service-recovery/EscalationTimeline";
import { requireAuth } from "@/lib/auth/guards";
import { getRecoveryCase } from "@/lib/service-recovery/recovery-case-service";

export default async function ServiceRecoveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const caseRecord = await getRecoveryCase(id);
  if (!caseRecord || caseRecord.participantId !== user.id) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">Recovery case</h1>
      <p className="text-muted-foreground">{caseRecord.summary}</p>
      <BackupOptionList caseId={caseRecord.id} options={caseRecord.backupOptions} />
      <RecoveryActionPanel caseId={caseRecord.id} status={caseRecord.status} />
      <EscalationTimeline events={caseRecord.events} escalations={caseRecord.escalations} />
    </div>
  );
}
