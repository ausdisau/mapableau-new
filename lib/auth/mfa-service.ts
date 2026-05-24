import { createHash, randomBytes } from "node:crypto";

import { hash, compare } from "bcryptjs";
import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";

import { logAuthSecurityEvent } from "@/lib/audit/auth-security-audit";
import { TRUSTED_DEVICE_DURATION_MS } from "@/lib/auth/mfa-policy";
import { encryptMfaSecret, decryptMfaSecret } from "@/lib/crypto/mfa-secret";
import { prisma } from "@/lib/prisma";

const MAX_CHALLENGE_ATTEMPTS = 5;
const ENROLLMENT_TTL_MS = 15 * 60 * 1000;

export async function getActiveTotpMethod(userId: string) {
  return prisma.mfaMethod.findFirst({
    where: {
      userId,
      type: "totp",
      enabledAt: { not: null },
      disabledAt: null,
    },
  });
}

export async function userHasMfaEnrolled(userId: string): Promise<boolean> {
  const method = await getActiveTotpMethod(userId);
  return Boolean(method);
}

export async function listMfaMethods(userId: string) {
  return prisma.mfaMethod.findMany({
    where: { userId, disabledAt: null },
    select: {
      id: true,
      type: true,
      label: true,
      isPrimary: true,
      enabledAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function startTotpEnrollment(userId: string, email: string) {
  await prisma.mfaChallenge.updateMany({
    where: {
      userId,
      challengeType: "enroll_totp",
      status: "pending",
    },
    data: { status: "expired" },
  });

  const secret = generateSecret();
  const otpauthUrl = generateURI({
    issuer: "MapAble",
    label: email,
    secret,
  });
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, {
    margin: 2,
    width: 256,
  });

  const challenge = await prisma.mfaChallenge.create({
    data: {
      userId,
      challengeType: "enroll_totp",
      status: "pending",
      expiresAt: new Date(Date.now() + ENROLLMENT_TTL_MS),
      metadata: {
        secretEncrypted: encryptMfaSecret(secret),
      },
    },
  });

  return {
    challengeId: challenge.id,
    qrDataUrl,
    manualKey: secret,
    expiresAt: challenge.expiresAt,
  };
}

export async function completeTotpEnrollment(
  userId: string,
  challengeId: string,
  code: string,
  audit?: { ipAddress?: string | null; userAgent?: string | null },
) {
  const challenge = await prisma.mfaChallenge.findFirst({
    where: {
      id: challengeId,
      userId,
      challengeType: "enroll_totp",
      status: "pending",
    },
  });

  if (!challenge || challenge.expiresAt < new Date()) {
    return { ok: false as const, error: "Setup expired. Please start again." };
  }

  const meta = challenge.metadata as { secretEncrypted?: string } | null;
  const secret = meta?.secretEncrypted
    ? decryptMfaSecret(meta.secretEncrypted)
    : null;
  if (!secret) {
    return { ok: false as const, error: "Invalid setup session." };
  }

  const verifyResult = await verify({ secret, token: code.replace(/\s/g, "") });
  const valid =
    typeof verifyResult === "boolean"
      ? verifyResult
      : Boolean(verifyResult?.valid);
  if (!valid) {
    await prisma.mfaChallenge.update({
      where: { id: challengeId },
      data: { attempts: { increment: 1 } },
    });
    return {
      ok: false as const,
      error: "That code did not match. Check your authenticator app and try again.",
    };
  }

  await prisma.mfaMethod.updateMany({
    where: { userId, type: "totp", disabledAt: null },
    data: { disabledAt: new Date() },
  });

  await prisma.mfaMethod.create({
    data: {
      userId,
      type: "totp",
      label: "Authenticator app",
      secretEncrypted: encryptMfaSecret(secret),
      isPrimary: true,
      enabledAt: new Date(),
    },
  });

  await prisma.mfaChallenge.update({
    where: { id: challengeId },
    data: { status: "completed", completedAt: new Date() },
  });

  const recoveryCodes = await regenerateRecoveryCodes(userId);

  await logAuthSecurityEvent({
    eventType: "mfa_enrolled",
    userId,
    ipAddress: audit?.ipAddress,
    userAgent: audit?.userAgent,
    metadata: { method: "totp" },
  });

  return { ok: true as const, recoveryCodes };
}

export async function regenerateRecoveryCodes(userId: string) {
  await prisma.mfaRecoveryCode.deleteMany({ where: { userId } });
  const plainCodes: string[] = [];

  for (let i = 0; i < 10; i++) {
    const segment = randomBytes(4).toString("hex").toUpperCase();
    const code = `${segment.slice(0, 4)}-${segment.slice(4, 8)}`;
    plainCodes.push(code);
    const codeHash = await hash(code.replace(/-/g, ""), 10);
    await prisma.mfaRecoveryCode.create({
      data: { userId, codeHash },
    });
  }

  return plainCodes;
}

export async function verifyTotpCode(
  userId: string,
  code: string,
  audit?: { ipAddress?: string | null; userAgent?: string | null },
) {
  const method = await getActiveTotpMethod(userId);
  if (!method?.secretEncrypted) {
    return { ok: false as const, error: "Authenticator app is not set up." };
  }

  const secret = decryptMfaSecret(method.secretEncrypted);
  if (!secret) {
    return { ok: false as const, error: "Could not verify code. Contact support." };
  }

  const verifyResult = await verify({ secret, token: code.replace(/\s/g, "") });
  const valid =
    typeof verifyResult === "boolean"
      ? verifyResult
      : Boolean(verifyResult?.valid);
  if (!valid) {
    await logAuthSecurityEvent({
      eventType: "mfa_challenge_failed",
      userId,
      ipAddress: audit?.ipAddress,
      userAgent: audit?.userAgent,
      metadata: { method: "totp" },
    });
    return { ok: false as const, error: "Incorrect code. Try again." };
  }

  await logAuthSecurityEvent({
    eventType: "mfa_challenge_success",
    userId,
    ipAddress: audit?.ipAddress,
    userAgent: audit?.userAgent,
    metadata: { method: "totp" },
  });

  return { ok: true as const };
}

export async function verifyRecoveryCode(
  userId: string,
  code: string,
  audit?: { ipAddress?: string | null; userAgent?: string | null },
) {
  const normalized = code.replace(/[\s-]/g, "").toUpperCase();
  const rows = await prisma.mfaRecoveryCode.findMany({
    where: { userId, usedAt: null },
  });

  for (const row of rows) {
    const match = await compare(normalized, row.codeHash);
    if (match) {
      await prisma.mfaRecoveryCode.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      });
      await logAuthSecurityEvent({
        eventType: "recovery_code_used",
        userId,
        ipAddress: audit?.ipAddress,
        userAgent: audit?.userAgent,
      });
      await logAuthSecurityEvent({
        eventType: "mfa_challenge_success",
        userId,
        ipAddress: audit?.ipAddress,
        userAgent: audit?.userAgent,
        metadata: { method: "recovery_code" },
      });
      return { ok: true as const, codesRemaining: rows.length - 1 };
    }
  }

  await logAuthSecurityEvent({
    eventType: "mfa_challenge_failed",
    userId,
    ipAddress: audit?.ipAddress,
    userAgent: audit?.userAgent,
    metadata: { method: "recovery_code" },
  });

  return { ok: false as const, error: "Recovery code not recognised or already used." };
}

export function hashDeviceToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function registerTrustedDevice(
  userId: string,
  deviceToken: string,
  label?: string,
  audit?: { ipAddress?: string | null; userAgent?: string | null },
) {
  const deviceTokenHash = hashDeviceToken(deviceToken);
  await prisma.trustedDevice.upsert({
    where: {
      userId_deviceTokenHash: { userId, deviceTokenHash },
    },
    create: {
      userId,
      deviceTokenHash,
      label: label ?? "Trusted device",
      expiresAt: new Date(Date.now() + TRUSTED_DEVICE_DURATION_MS),
      lastUsedAt: new Date(),
    },
    update: {
      expiresAt: new Date(Date.now() + TRUSTED_DEVICE_DURATION_MS),
      lastUsedAt: new Date(),
    },
  });

  await logAuthSecurityEvent({
    eventType: "trusted_device_added",
    userId,
    ipAddress: audit?.ipAddress,
    userAgent: audit?.userAgent,
  });
}

export async function isTrustedDevice(
  userId: string,
  deviceToken: string | undefined,
): Promise<boolean> {
  if (!deviceToken) return false;
  const deviceTokenHash = hashDeviceToken(deviceToken);
  const device = await prisma.trustedDevice.findUnique({
    where: {
      userId_deviceTokenHash: { userId, deviceTokenHash },
    },
  });
  if (!device) return false;
  if (device.expiresAt < new Date()) return false;
  await prisma.trustedDevice.update({
    where: { id: device.id },
    data: { lastUsedAt: new Date() },
  });
  return true;
}

export async function removeMfaMethod(
  userId: string,
  methodId: string,
  options: {
    actorUserId: string;
    isAdminAction?: boolean;
    ipAddress?: string | null;
    userAgent?: string | null;
  },
) {
  const method = await prisma.mfaMethod.findFirst({
    where: { id: methodId, userId, disabledAt: null },
  });
  if (!method) {
    return { ok: false as const, error: "Method not found." };
  }

  const remaining = await prisma.mfaMethod.count({
    where: { userId, disabledAt: null, id: { not: methodId } },
  });

  if (remaining === 0 && options.actorUserId === userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { primaryRole: true },
    });
    const { roleRequiresMfaEnrollment } = await import("@/lib/auth/mfa-policy");
    if (user && roleRequiresMfaEnrollment(user.primaryRole)) {
      return {
        ok: false as const,
        error:
          "Your role requires MFA. Add another method before removing this one.",
      };
    }
  }

  await prisma.mfaMethod.update({
    where: { id: methodId },
    data: { disabledAt: new Date() },
  });

  await logAuthSecurityEvent({
    eventType: "mfa_removed",
    userId,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
    metadata: {
      methodId,
      type: method.type,
      removedByAdmin: options.isAdminAction ?? false,
      actorUserId: options.actorUserId,
    },
  });

  return { ok: true as const };
}

export function createDeviceToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function incrementChallengeFailure(challengeId: string) {
  const challenge = await prisma.mfaChallenge.update({
    where: { id: challengeId },
    data: { attempts: { increment: 1 } },
  });
  if (challenge.attempts >= MAX_CHALLENGE_ATTEMPTS) {
    await prisma.mfaChallenge.update({
      where: { id: challengeId },
      data: { status: "failed" },
    });
  }
  return challenge.attempts;
}
