import type { CivicAccessEntity } from "@prisma/client";

export interface ContactView {
  publicContactReference: string | null;
  privateOperationalContactReference?: string | null;
}

export function projectEntityContact(
  entity: CivicAccessEntity,
  includePrivate = false,
): ContactView {
  return {
    publicContactReference: entity.publicContactReference,
    ...(includePrivate
      ? {
          privateOperationalContactReference:
            entity.privateOperationalContactReference,
        }
      : {}),
  };
}
