import { createHash } from "crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { checkPhoneVerification } from "@/lib/twilio/check-verify";
import { isTwilioVerifyConfigured } from "@/lib/twilio/config";
import { startPhoneVerification } from "@/lib/twilio/start-verify";
import { normalizePhoneE164 } from "@/lib/validation/communications";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS_PER_WINDOW = 5;

export async function countRecentVerificationAttempts(userId: string): Promise<number> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  return prisma.phoneVerification.count({
    where: {
      userId,
      lastAttemptAt: { gte: since },
    },
  });
}

export async function startUserPhoneVerification(params: {
  userId: string;
  phone: string;
  channel?: "sms" | "call";
}) {
  const phoneNumberE164 = normalizePhoneE164(params.phone);
  if (!phoneNumberE164) {
    throw new Error("INVALID_PHONE");
  }

  const attempts = await countRecentVerificationAttempts(params.userId);
  if (attempts >= MAX_ATTEMPTS_PER_WINDOW) {
    throw new Error("RATE_LIMITED");
  }

  let twilioSid: string | undefined;
  let status = "pending";

  if (isTwilioVerifyConfigured()) {
    const result = await startPhoneVerification(
      phoneNumberE164,
      params.channel ?? "sms"
    );
    twilioSid = result.sid;
    status = result.status;
  }

  const verification = await prisma.phoneVerification.create({
    data: {
      userId: params.userId,
      phoneNumberE164,
      status: "pending",
      twilioSid,
      attemptCount: 1,
      lastAttemptAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  await prisma.user.update({
    where: { id: params.userId },
    data: { phone: phoneNumberE164 },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: "phone_verification_started",
    entityType: "PhoneVerification",
    entityId: verification.id,
    participantId: params.userId,
    metadata: { phoneLast4: phoneNumberE164.slice(-4) },
  });

  return verification;
}

export async function checkUserPhoneVerification(params: {
  userId: string;
  phone: string;
  code: string;
}) {
  const phoneNumberE164 = normalizePhoneE164(params.phone);
  if (!phoneNumberE164) {
    throw new Error("INVALID_PHONE");
  }

  const record = await prisma.phoneVerification.findFirst({
    where: {
      userId: params.userId,
      phoneNumberE164,
      status: "pending",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new Error("VERIFICATION_NOT_FOUND");
  }

  let valid = false;
  if (isTwilioVerifyConfigured()) {
    const check = await checkPhoneVerification(phoneNumberE164, params.code);
    valid = check.valid;
  } else if (process.env.NODE_ENV !== "production") {
    valid = params.code === "000000";
  }

  if (!valid) {
    await prisma.phoneVerification.update({
      where: { id: record.id },
      data: {
        status: "failed",
        attemptCount: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    });
    await createAuditEvent({
      actorUserId: params.userId,
      action: "phone_verification_failed",
      entityType: "PhoneVerification",
      entityId: record.id,
      participantId: params.userId,
    });
    throw new Error("VERIFICATION_FAILED");
  }

  const updated = await prisma.phoneVerification.update({
    where: { id: record.id },
    data: {
      status: "approved",
      verifiedAt: new Date(),
    },
  });

  await prisma.communicationPreference.updateMany({
    where: { userId: params.userId, channel: { in: ["sms", "whatsapp", "voice"] } },
    data: { phoneNumberE164 },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: "phone_verification_succeeded",
    entityType: "PhoneVerification",
    entityId: record.id,
    participantId: params.userId,
  });

  return updated;
}

export function hashWebhookPayload(payload: Record<string, string>): string {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}
