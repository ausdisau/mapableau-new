import type {
  PortableClaim,
  PortableClaimCategory,
  PortableClaimProvenance,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Prohibited claim statements. These are guarded here even though callers
 * should also be blocked at the credential-schema layer. NDIS numbers,
 * Medicare numbers etc. must never appear in a self-asserted portable
 * claim.
 */
const PROHIBITED_STATEMENT_PATTERNS = [
  /\bndis\s*(?:number|no\.?|id)\b/i,
  /\bmedicare\s*(?:number|no\.?|card)\b/i,
  /\bdva\s*(?:number|id)\b/i,
];

export function isProhibitedStatement(statement: string): boolean {
  return PROHIBITED_STATEMENT_PATTERNS.some((rx) => rx.test(statement));
}

export async function assertPortableClaim(input: {
  subjectId: string;
  asserterId: string;
  category: PortableClaimCategory;
  provenance: PortableClaimProvenance;
  statement: string;
  functionalContext?: string;
  verificationRef?: string;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
}): Promise<PortableClaim> {
  if (isProhibitedStatement(input.statement)) {
    throw new Error(
      "prohibited_statement: NDIS/Medicare/DVA numbers cannot appear in a portable claim"
    );
  }
  return prisma.portableClaim.create({
    data: {
      subjectId: input.subjectId,
      asserterId: input.asserterId,
      category: input.category,
      provenance: input.provenance,
      statement: input.statement,
      functionalContext: input.functionalContext ?? null,
      verificationRef: input.verificationRef ?? null,
      effectiveFrom: input.effectiveFrom ?? null,
      effectiveUntil: input.effectiveUntil ?? null,
    },
  });
}

export async function listClaimsForSubject(subjectId: string) {
  return prisma.portableClaim.findMany({
    where: { subjectId },
    orderBy: { createdAt: "desc" },
  });
}
