import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { remainingSystemsConfig } from "@/lib/config/remaining-systems";
import { prisma } from "@/lib/prisma";

export async function listRetentionPolicies() {
  if (!remainingSystemsConfig.privacyGovernanceEnabled) {
    throw new Error("PRIVACY_GOVERNANCE_DISABLED");
  }
  return prisma.dataRetentionPolicy.findMany({
    where: { active: true },
    orderBy: { entityType: "asc" },
  });
}

export async function runRetentionJob(policyId: string, dryRun = true) {
  const policy = await prisma.dataRetentionPolicy.findUnique({
    where: { id: policyId },
  });
  if (!policy) throw new Error("NOT_FOUND");

  const job = await prisma.dataRetentionJob.create({
    data: {
      policyId,
      dryRun,
      status: "completed",
      resultJson: {
        entityType: policy.entityType,
        retainDays: policy.retainDays,
        dryRun,
        affectedEstimate: 0,
        message: dryRun
          ? "Dry run only — no records deleted"
          : "Execution requires admin review",
      },
    },
  });

  await createAuditEvent({
    action: "privacy.retention_job_run",
    entityType: "DataRetentionJob",
    entityId: job.id,
    metadata: { policyId, dryRun },
  });

  return job;
}
