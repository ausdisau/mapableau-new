import type {
  WalletKeyBinding,
  WalletKeyPurpose,
  WalletKeyReference,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

import { opaqueKeyRef } from "@/lib/credentials/keys";

export interface RegisterKeyReferenceInput {
  walletId: string;
  purpose: WalletKeyPurpose;
  binding: WalletKeyBinding;
  algorithm: string;
  publicKeyJwk?: Record<string, unknown>;
  scope?: string;
  subject?: string;
}

export async function registerKeyReference(
  input: RegisterKeyReferenceInput
): Promise<WalletKeyReference> {
  const keyRef = opaqueKeyRef({
    scope: input.scope ?? "wallet",
    subject: input.subject ?? input.walletId,
    purpose: input.purpose,
    binding: input.binding,
  });
  return prisma.walletKeyReference.create({
    data: {
      walletId: input.walletId,
      purpose: input.purpose,
      binding: input.binding,
      algorithm: input.algorithm,
      publicKeyJwk: asJson(input.publicKeyJwk),
      keyRef,
    },
  });
}

export async function revokeKeyReference(id: string): Promise<void> {
  await prisma.walletKeyReference.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
}
