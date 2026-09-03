import { consentScopeFromPrisma } from "@/lib/consent/scope-map";
import { prisma } from "@/lib/prisma";
import type { ConsentScope } from "@/types/mapable";

/** Scopes a participant may delegate to a trusted person. */
export const DELEGATABLE_CONSENT_SCOPES: readonly ConsentScope[] = [
  "profile.read",
  "accessibility.read",
  "booking.read",
  "booking.manage",
  "messages.send",
  "support_profile.read",
  "engagement.read_delegate",
  "engagement.submit_delegate",
  "transport.trip_access",
  "care.accessibility_share",
  "transport.accessibility_share",
] as const;

const NON_DELEGATABLE_SCOPES: readonly ConsentScope[] = [
  "billing.read",
  "plan_manager.invoice_access",
  "go.current_location",
  "go.route_history",
  "go.barrier_report",
  "support_coordination.access",
] as const;

export class DelegateScopeError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "DelegateScopeError";
  }
}

export function assertDelegatableConsentScope(scope: string): ConsentScope {
  if (
    !(DELEGATABLE_CONSENT_SCOPES as readonly string[]).includes(scope)
  ) {
    if ((NON_DELEGATABLE_SCOPES as readonly string[]).includes(scope)) {
      throw new DelegateScopeError(
        `Consent scope cannot be delegated: ${scope}`,
      );
    }
    throw new DelegateScopeError(`Unknown or non-delegatable scope: ${scope}`);
  }
  return scope as ConsentScope;
}

/**
 * Delegate proposed scopes must not exceed scopes the participant has
 * actively granted (to any recipient) — participants cannot delegate
 * authority they have not established as shareable.
 */
export async function validateDelegateConsentScopes(
  participantId: string,
  proposedScopes: string[],
): Promise<ConsentScope[]> {
  if (proposedScopes.length === 0) {
    throw new DelegateScopeError("At least one consent scope is required");
  }

  const normalised = proposedScopes.map(assertDelegatableConsentScope);
  const unique = Array.from(new Set(normalised));

  const now = new Date();
  const activeConsents = await prisma.consentRecord.findMany({
    where: {
      subjectUserId: participantId,
      status: "active",
      OR: [{ expiryDate: null }, { expiryDate: { gt: now } }],
    },
    select: { scope: true },
  });

  const activeScopes = new Set(
    activeConsents.map((c) => consentScopeFromPrisma(c.scope)),
  );

  for (const scope of unique) {
    if (!activeScopes.has(scope)) {
      throw new DelegateScopeError(
        `Delegate scope exceeds participant-granted scopes: ${scope}`,
      );
    }
  }

  return unique;
}
