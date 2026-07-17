import { prisma } from "@/lib/prisma";

export interface AccessHistoryRow {
  createdAt: Date;
  actorLabel: string | null;
  purpose: string;
  action: string;
  outcome: string;
  minimisation: unknown;
  correlationId: string | null;
  directiveId: string;
}

/**
 * Participant-facing access history. This is the read-only view that shows
 * "who saw or used what, when and under which directive". It surfaces
 * `ConsentUseEvent`s joined to their `ConsentDirective` for context and
 * caps rows to keep the view responsive.
 */
export async function loadAccessHistoryForParticipant(
  participantId: string,
  limit = 100
): Promise<AccessHistoryRow[]> {
  const rows = await prisma.consentUseEvent.findMany({
    where: { directive: { subjectId: participantId } },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 500),
    include: {
      directive: {
        select: {
          id: true,
          purpose: true,
          recipientCategory: true,
          recipientOrganisationId: true,
        },
      },
    },
  });

  return rows.map((r) => ({
    createdAt: r.createdAt,
    actorLabel:
      r.actorLabel ??
      r.directive.recipientOrganisationId ??
      r.directive.recipientCategory,
    purpose: r.purpose,
    action: r.action,
    outcome: r.outcome,
    minimisation: r.minimisation,
    correlationId: r.correlationId,
    directiveId: r.directiveId,
  }));
}

/**
 * Small in-code redaction planner. Given a requested field set and a
 * minimisation policy label, decide the outbound field set. Callers are
 * expected to feed this into the disclosure gateway which combines policy
 * with the directive verdict.
 */
export function planFieldMinimisation(
  requested: string[],
  policy: "minimum_necessary" | "strict" | "open" = "minimum_necessary"
): {
  allowed: string[];
  redacted: string[];
} {
  const alwaysAllow = new Set<string>([
    "displayName",
    "accessibilityPreferences",
    "communicationPreference",
    "preferredLocale",
  ]);
  const denyByDefault = new Set<string>([
    "email",
    "phone",
    "ndisNumber",
    "residentialAddress",
    "dateOfBirth",
    "medicalDetails",
    "financialDetails",
    "governmentIdentifier",
  ]);

  if (policy === "open") {
    return { allowed: [...requested], redacted: [] };
  }
  const allowed: string[] = [];
  const redacted: string[] = [];
  for (const field of requested) {
    if (alwaysAllow.has(field)) {
      allowed.push(field);
      continue;
    }
    if (policy === "strict") {
      redacted.push(field);
      continue;
    }
    if (denyByDefault.has(field)) {
      redacted.push(field);
      continue;
    }
    allowed.push(field);
  }
  return { allowed, redacted };
}
