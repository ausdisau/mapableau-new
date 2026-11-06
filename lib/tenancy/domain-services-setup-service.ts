import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { ensureDomainServicesSelfServeEnabled } from "@/lib/config/domain-services";
import { prisma } from "@/lib/prisma";
import type {
  DomainServicesBrandDraft,
  DomainServicesModuleKey,
} from "@/lib/tenancy/domain-services-brand";
import {
  getDraftByOrganisationId,
  upsertDraftTenant,
  type DomainServicesDraftTenant,
} from "@/lib/tenancy/domain-services-registry";

export async function findProviderOrganisationIdForUser(
  userId: string,
): Promise<string | null> {
  const membership = await prisma.organisationMember.findFirst({
    where: {
      userId,
      role: { in: ["provider_admin", "support_worker"] },
    },
    orderBy: { createdAt: "asc" },
  });
  return membership?.organisationId ?? null;
}

/**
 * Narrow self-serve: create the caller's own care_provider organisation
 * and provider_admin membership when they do not already have one.
 * Requires Domain Services self-serve flag. Never creates orgs for other users.
 */
export async function ensureSelfServeProviderOrganisation(input: {
  actor: CurrentUser;
  companyName: string;
  contactEmail?: string;
}): Promise<{ organisationId: string; created: boolean }> {
  ensureDomainServicesSelfServeEnabled();

  const existing = await findProviderOrganisationIdForUser(input.actor.id);
  if (existing) return { organisationId: existing, created: false };

  const org = await prisma.organisation.create({
    data: {
      name: input.companyName.trim() || `${input.actor.name}'s organisation`,
      organisationType: "care_provider",
      contactEmail: input.contactEmail?.trim() || input.actor.email,
      verificationStatus: "not_started",
      status: "active",
      notes:
        "Created via MapAble Domain Services self-serve wizard (draft / preview).",
    },
  });

  await prisma.organisationMember.create({
    data: {
      userId: input.actor.id,
      organisationId: org.id,
      role: "provider_admin",
    },
  });

  // Ensure provider_admin appears on the user role set for subsequent checks.
  await prisma.userRoleAssignment.upsert({
    where: {
      userId_role: { userId: input.actor.id, role: "provider_admin" },
    },
    create: { userId: input.actor.id, role: "provider_admin" },
    update: {},
  });

  if (input.actor.primaryRole === "participant") {
    await prisma.user.update({
      where: { id: input.actor.id },
      data: { primaryRole: "provider_admin" },
    });
  }

  await createAuditEvent({
    actorUserId: input.actor.id,
    actorRole: "provider_admin",
    action: "domain_services.self_serve_organisation.created",
    entityType: "Organisation",
    entityId: org.id,
    organisationId: org.id,
    metadata: { source: "domain_services_wizard" },
  });

  return { organisationId: org.id, created: true };
}

export async function saveDomainServicesSetup(input: {
  actor: CurrentUser;
  slug: string;
  brand: DomainServicesBrandDraft;
  modules: Record<DomainServicesModuleKey, boolean>;
}): Promise<DomainServicesDraftTenant> {
  ensureDomainServicesSelfServeEnabled();

  const { organisationId } = await ensureSelfServeProviderOrganisation({
    actor: input.actor,
    companyName: input.brand.companyName,
    contactEmail: input.brand.supportEmail || input.actor.email,
  });

  const draft = upsertDraftTenant({
    organisationId,
    ownerUserId: input.actor.id,
    slug: input.slug,
    brand: input.brand,
    modules: input.modules,
  });

  await createAuditEvent({
    actorUserId: input.actor.id,
    actorRole: "provider_admin",
    action: "domain_services.draft_tenant.upserted",
    entityType: "DomainServicesDraftTenant",
    entityId: draft.id,
    organisationId,
    metadata: {
      slug: draft.slug,
      domainActivation: draft.domainActivation,
      synthetic: true,
    },
  });

  return draft;
}

export async function loadDomainServicesSetupForActor(
  actor: CurrentUser,
): Promise<DomainServicesDraftTenant | null> {
  ensureDomainServicesSelfServeEnabled();
  const organisationId = await findProviderOrganisationIdForUser(actor.id);
  if (!organisationId) return null;
  return getDraftByOrganisationId(organisationId);
}
