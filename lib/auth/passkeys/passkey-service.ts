import { randomBytes } from "crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { remainingSystemsConfig } from "@/lib/config/remaining-systems";
import { prisma } from "@/lib/prisma";

export async function createRegistrationChallenge(userId: string) {
  if (!remainingSystemsConfig.passkeysEnabled) {
    throw new Error("PASSKEYS_DISABLED");
  }

  const challenge = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.passkeyChallenge.create({
    data: { userId, challenge, type: "registration", expiresAt },
  });

  await prisma.passkeyEvent.create({
    data: { userId, eventType: "registration_challenge_created" },
  });

  return { challenge, expiresAt };
}

export async function verifyRegistrationPlaceholder(params: {
  userId: string;
  challenge: string;
  credentialId: string;
  publicKey: string;
  deviceName?: string;
}) {
  const pending = await prisma.passkeyChallenge.findFirst({
    where: {
      userId: params.userId,
      challenge: params.challenge,
      type: "registration",
      expiresAt: { gt: new Date() },
    },
  });
  if (!pending) throw new Error("INVALID_CHALLENGE");

  const credential = await prisma.passkeyCredential.create({
    data: {
      userId: params.userId,
      credentialId: params.credentialId,
      publicKey: params.publicKey,
      deviceName: params.deviceName ?? "Passkey",
    },
  });

  await prisma.passkeyEvent.create({
    data: { userId: params.userId, eventType: "passkey_registered" },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: "auth.passkey_registered",
    entityType: "PasskeyCredential",
    entityId: credential.id,
  });

  return credential;
}

export async function listPasskeys(userId: string) {
  return prisma.passkeyCredential.findMany({
    where: { userId, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokePasskey(credentialId: string, userId: string) {
  const cred = await prisma.passkeyCredential.findFirst({
    where: { id: credentialId, userId, revokedAt: null },
  });
  if (!cred) throw new Error("NOT_FOUND");

  await prisma.passkeyCredential.update({
    where: { id: credentialId },
    data: { revokedAt: new Date() },
  });

  await prisma.passkeyEvent.create({
    data: { userId, eventType: "passkey_revoked" },
  });

  await createAuditEvent({
    actorUserId: userId,
    action: "auth.passkey_revoked",
    entityType: "PasskeyCredential",
    entityId: credentialId,
  });
}

export async function createLoginChallenge() {
  const challenge = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await prisma.passkeyChallenge.create({
    data: { challenge, type: "login", expiresAt },
  });
  return { challenge, expiresAt };
}
