import type { ConsentDirective } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { withdrawConsentDirective } from "./directives";

/**
 * Revocation in Wave 9 is not a mutation. It always creates a new
 * withdrawn directive that supersedes the previous version.
 *
 * `revokeAllForRecipient` writes one withdrawal per active directive matching
 * the (subject, recipient) pair. This mirrors a participant's "remove all
 * access for this org" gesture.
 */

export async function revokeAllForRecipient(input: {
  subjectId: string;
  actorId: string;
  recipientOrganisationId?: string | null;
  recipientEntityId?: string | null;
  reason?: string;
}): Promise<ConsentDirective[]> {
  const active = await prisma.consentDirective.findMany({
    where: {
      subjectId: input.subjectId,
      status: "active",
      decision: "active",
      recipientOrganisationId: input.recipientOrganisationId ?? undefined,
      recipientEntityId: input.recipientEntityId ?? undefined,
    },
  });

  const withdrawn: ConsentDirective[] = [];
  for (const directive of active) {
    const result = await withdrawConsentDirective(
      directive.id,
      input.actorId,
      input.reason
    );
    withdrawn.push(result.directive);
  }
  return withdrawn;
}
