import type { VaultItemKind } from "./errors";

export type VaultGrantSummary = {
  id: string;
  granteeUserId: string;
  purpose: string;
  expiresAt: string;
  revokedAt: string | null;
};

export type VaultItemSummary = {
  id: string;
  documentId: string;
  kind: VaultItemKind;
  label: string | null;
  title: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  grants: VaultGrantSummary[];
};
