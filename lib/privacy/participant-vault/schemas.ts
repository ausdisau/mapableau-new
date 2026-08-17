import { z } from "zod";

import { VAULT_ITEM_KINDS } from "./errors";

export const vaultItemKindSchema = z.enum(VAULT_ITEM_KINDS);

export const attachVaultItemSchema = z
  .object({
    kind: vaultItemKindSchema,
    label: z.string().max(120).optional().nullable(),
    documentId: z.string().min(8).max(64),
  })
  .strict();

export const shareVaultItemSchema = z
  .object({
    granteeUserId: z.string().min(8).max(64),
    purpose: z.string().trim().min(8).max(500),
    expiresAt: z.string().datetime(),
  })
  .strict();

export const revokeVaultShareSchema = z
  .object({
    grantId: z.string().min(8).max(64),
  })
  .strict();
