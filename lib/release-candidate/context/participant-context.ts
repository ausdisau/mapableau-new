import type { CurrentUser } from "@/lib/auth/current-user";

import type { ReleaseCandidateRequestContext } from "./request-context";

export interface ReleaseCandidateParticipantContext {
  participantUserId: string;
  actorUserId: string;
  organisationId: string | null;
  relationship: "self" | "delegate" | "worker" | "admin";
  sourceModules: {
    auth: "@/lib/auth/current-user";
    consent: "@/lib/consent/*";
    delegation: "@/lib/delegation/authority";
  };
}

export function buildParticipantContext(input: {
  requestContext: ReleaseCandidateRequestContext;
  participantUserId: string;
  relationship?: ReleaseCandidateParticipantContext["relationship"];
}): ReleaseCandidateParticipantContext {
  return {
    participantUserId: input.participantUserId,
    actorUserId: input.requestContext.currentUser.id,
    organisationId: input.requestContext.tenant.organisationId,
    relationship:
      input.relationship ??
      (input.requestContext.currentUser.id === input.participantUserId
        ? "self"
        : "delegate"),
    sourceModules: {
      auth: "@/lib/auth/current-user",
      consent: "@/lib/consent/*",
      delegation: "@/lib/delegation/authority",
    },
  };
}

export function syntheticCurrentUser(input: {
  id: string;
  primaryRole: CurrentUser["primaryRole"];
  email?: string;
  name?: string;
}): CurrentUser {
  return {
    id: input.id,
    email: input.email ?? `${input.id}@synthetic.mapable.test`,
    name: input.name ?? input.id,
    phone: null,
    timezone: "Australia/Sydney",
    locale: "en-AU",
    primaryRole: input.primaryRole,
    roles: [input.primaryRole],
  };
}
