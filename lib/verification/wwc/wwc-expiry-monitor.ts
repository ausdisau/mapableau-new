import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";
import { recordWwcVerificationEvent } from "@/lib/verification/wwc/wwc-event-service";
import { syncWorkerWwccStatus } from "@/lib/verification/wwc/wwc-eligibility-service";

const REMINDER_DAYS = [90, 60, 30, 14, 7] as const;

export type WwcExpiryMonitorResult = {
  expiredCount: number;
  remindersSent: number;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

export async function runWwcExpiryMonitor(): Promise<WwcExpiryMonitorResult> {
  const now = new Date();
  let expiredCount = 0;
  let remindersSent = 0;

  const approved = await prisma.wwcVerification.findMany({
    where: {
      status: { in: ["approved", "not_required"] },
      expiresAt: { not: null },
    },
    include: {
      workerProfile: { select: { userId: true, displayName: true } },
    },
  });

  for (const v of approved) {
    if (!v.expiresAt) continue;

    if (v.expiresAt < now) {
      await prisma.wwcVerification.update({
        where: { id: v.id },
        data: { status: "expired" },
      });
      await recordWwcVerificationEvent({
        verificationId: v.id,
        eventType: "expired",
        organisationId: v.organisationId,
        workerProfileId: v.workerProfileId,
        payload: { auto: true },
      });
      await syncWorkerWwccStatus(v.workerProfileId);
      expiredCount++;

      if (v.workerProfile.userId) {
        await notifyUser(
          v.workerProfile.userId,
          "system",
          "Working With Children Check expired",
          "Your child-related check has expired. Update your verification at /worker/verification/wwc to continue child-related supports."
        );
      }
      continue;
    }

    const daysUntil = daysBetween(now, v.expiresAt);
    if (REMINDER_DAYS.includes(daysUntil as (typeof REMINDER_DAYS)[number])) {
      remindersSent++;
      if (v.workerProfile.userId) {
        await notifyUser(
          v.workerProfile.userId,
          "system",
          `WWC expires in ${daysUntil} days`,
          "Please renew your check before it expires to remain eligible for child-related supports."
        );
      }
      await createAuditEvent({
        action: "wwc_verification.expiry_reminder",
        entityType: "WwcVerification",
        entityId: v.id,
        organisationId: v.organisationId,
        metadata: { daysUntil },
      });
    }
  }

  return { expiredCount, remindersSent };
}
