import { z } from "zod";

import type {
  DelegateAuthority,
  DelegateAuthorityCategory,
  DelegateAuthorityStatus,
  DelegateAuthorityVerification,
  DelegateRelationshipKind,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { recordAuthorityTransaction } from "./transactions";

/**
 * A DelegateAuthority is an *explicit* grant of authority from a participant
 * to another user, scoped to categories and (optionally) an organisation.
 *
 * Wave 9 invariants:
 *  - Relationship != authority. Creating a family_member relationship does
 *    NOT create a DelegateAuthority. This module is the only place authority
 *    is minted.
 *  - A participant cannot mint an authority OVER their own identity — i.e.
 *    identity-recovery-assist granted from a user to themselves is refused.
 *  - AI cannot approve `legal_representation` or `emergency_action`.
 *    Verification must be `legal_instrument_verified` for legal_representation,
 *    and must be at least `platform_verified` for emergency_action. This is
 *    enforced here and re-checked at the API layer.
 */

export const proposeDelegateAuthoritySchema = z.object({
  participantId: z.string().min(1),
  delegateId: z.string().min(1),
  relationshipKind: z.enum([
    "family_member",
    "informal_supporter",
    "emergency_contact",
    "legal_guardian",
    "power_of_attorney_personal",
    "power_of_attorney_financial",
    "nominee_ndis",
    "professional_advocate",
    "paid_supporter",
    "none",
  ]),
  authorityCategories: z
    .array(
      z.enum([
        "view_only",
        "contact_and_scheduling",
        "service_coordination",
        "billing_view",
        "billing_manage",
        "legal_representation",
        "emergency_action",
        "identity_recovery_assist",
      ])
    )
    .min(1),
  scopedOrganisationId: z.string().nullish(),
  verification: z
    .enum([
      "self_asserted",
      "platform_verified",
      "document_verified",
      "legal_instrument_verified",
    ])
    .default("self_asserted"),
  effectiveFrom: z.date().optional(),
  effectiveUntil: z.date().nullish(),
  legalInstrumentRef: z.string().nullish(),
  notes: z.string().nullish(),
  actorId: z.string().min(1),
});

export type ProposeDelegateAuthorityInput = z.infer<
  typeof proposeDelegateAuthoritySchema
>;

export interface ProposeDelegateAuthorityResult {
  authority: DelegateAuthority;
}

export async function proposeDelegateAuthority(
  raw: ProposeDelegateAuthorityInput
): Promise<ProposeDelegateAuthorityResult> {
  const input = proposeDelegateAuthoritySchema.parse(raw);
  if (input.participantId === input.delegateId) {
    throw new Error("delegate_own_identity_refused");
  }

  enforceAuthorityInvariants(
    input.authorityCategories as DelegateAuthorityCategory[],
    input.verification as DelegateAuthorityVerification
  );

  const authority = await prisma.delegateAuthority.upsert({
    where: {
      participantId_delegateId_relationshipKind: {
        participantId: input.participantId,
        delegateId: input.delegateId,
        relationshipKind: input.relationshipKind as DelegateRelationshipKind,
      },
    },
    create: {
      participantId: input.participantId,
      delegateId: input.delegateId,
      relationshipKind: input.relationshipKind as DelegateRelationshipKind,
      authorityCategories: input.authorityCategories as
        DelegateAuthorityCategory[],
      scopedOrganisationId: input.scopedOrganisationId ?? null,
      verification: input.verification as DelegateAuthorityVerification,
      status: "proposed",
      effectiveFrom: input.effectiveFrom ?? null,
      effectiveUntil: input.effectiveUntil ?? null,
      legalInstrumentRef: input.legalInstrumentRef ?? null,
      notes: input.notes ?? null,
    },
    update: {
      authorityCategories: input.authorityCategories as
        DelegateAuthorityCategory[],
      scopedOrganisationId: input.scopedOrganisationId ?? null,
      verification: input.verification as DelegateAuthorityVerification,
      effectiveFrom: input.effectiveFrom ?? null,
      effectiveUntil: input.effectiveUntil ?? null,
      legalInstrumentRef: input.legalInstrumentRef ?? null,
      notes: input.notes ?? null,
    },
  });

  await recordAuthorityTransaction({
    authorityId: authority.id,
    actorId: input.actorId,
    transactionKind: "proposed",
    fromStatus: null,
    toStatus: "proposed",
  });
  return { authority };
}

export async function activateDelegateAuthority(
  authorityId: string,
  actorId: string
): Promise<DelegateAuthority> {
  const authority = await prisma.delegateAuthority.findUnique({
    where: { id: authorityId },
  });
  if (!authority) throw new Error("authority_not_found");

  enforceAuthorityInvariants(
    authority.authorityCategories,
    authority.verification
  );

  const updated = await prisma.delegateAuthority.update({
    where: { id: authorityId },
    data: { status: "active" },
  });
  await recordAuthorityTransaction({
    authorityId,
    actorId,
    transactionKind: "activated",
    fromStatus: authority.status,
    toStatus: "active",
  });
  return updated;
}

export function enforceAuthorityInvariants(
  categories: DelegateAuthorityCategory[],
  verification: DelegateAuthorityVerification
) {
  const wantsLegal = categories.includes("legal_representation");
  const wantsEmergency = categories.includes("emergency_action");
  const wantsBillingManage = categories.includes("billing_manage");

  if (wantsLegal && verification !== "legal_instrument_verified") {
    throw new Error(
      "authority_invariant: legal_representation requires legal_instrument_verified"
    );
  }
  if (
    wantsEmergency &&
    verification === "self_asserted"
  ) {
    throw new Error(
      "authority_invariant: emergency_action requires platform_verified or higher"
    );
  }
  if (
    wantsBillingManage &&
    verification === "self_asserted"
  ) {
    throw new Error(
      "authority_invariant: billing_manage requires platform_verified or higher"
    );
  }
}

export async function isEffectiveNow(
  authority: Pick<
    DelegateAuthority,
    "status" | "effectiveFrom" | "effectiveUntil"
  >
): Promise<boolean> {
  if (authority.status !== "active") return false;
  const now = new Date();
  if (authority.effectiveFrom && authority.effectiveFrom > now) return false;
  if (authority.effectiveUntil && authority.effectiveUntil <= now) return false;
  return true;
}

export async function listAuthoritiesForParticipant(participantId: string) {
  return prisma.delegateAuthority.findMany({
    where: { participantId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export function hasAuthorityCategory(
  authority: Pick<DelegateAuthority, "authorityCategories" | "status">,
  category: DelegateAuthorityCategory
): boolean {
  return (
    authority.status === "active" &&
    authority.authorityCategories.includes(category)
  );
}

export function inferStatusTransition(
  from: DelegateAuthorityStatus,
  to: DelegateAuthorityStatus
): boolean {
  const map: Record<DelegateAuthorityStatus, DelegateAuthorityStatus[]> = {
    proposed: ["active", "revoked", "expired"],
    active: ["suspended", "revoked", "expired"],
    suspended: ["active", "revoked", "expired"],
    revoked: [],
    expired: [],
  };
  return map[from].includes(to);
}
