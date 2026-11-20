import {
  defaultBrandDraft,
  defaultModuleFlags,
  type DomainServicesBrandDraft,
  type DomainServicesModuleKey,
} from "@/lib/tenancy/domain-services-brand";
import {
  normalizeSlug,
  validateBrand,
  validateModules,
  validateSlug,
} from "@/lib/tenancy/domain-services-wizard-model";
import { isReservedTenantLabel } from "@/lib/tenancy/tenant-host-policy";

export type DomainServicesDraftTenant = {
  id: string;
  slug: string;
  name: string;
  organisationId: string;
  ownerUserId: string;
  status: "preview" | "not_configured";
  synthetic: true;
  brand: DomainServicesBrandDraft;
  modules: Record<DomainServicesModuleKey, boolean>;
  domainActivation: "NOT_CONFIGURED";
  createdAt: string;
  updatedAt: string;
};

type MemoryState = {
  bySlug: Map<string, DomainServicesDraftTenant>;
  byOrgId: Map<string, string>;
};

const globalStore = globalThis as typeof globalThis & {
  __mapableDomainServicesDrafts?: MemoryState;
};

function store(): MemoryState {
  if (!globalStore.__mapableDomainServicesDrafts) {
    globalStore.__mapableDomainServicesDrafts = {
      bySlug: new Map(),
      byOrgId: new Map(),
    };
  }
  return globalStore.__mapableDomainServicesDrafts;
}

function nowIso() {
  return new Date().toISOString();
}

function id() {
  return `tenant_ds_${crypto.randomUUID()}`;
}

export function resetDomainServicesDraftsForTests() {
  store().bySlug.clear();
  store().byOrgId.clear();
}

export function isSlugAvailable(
  raw: string,
  options?: { organisationId?: string },
): {
  available: boolean;
  reason?: string;
} {
  const slug = normalizeSlug(raw);
  const err = validateSlug(slug);
  if (err === "SLUG_REQUIRED") return { available: false, reason: err };
  if (err === "SLUG_INVALID") return { available: false, reason: err };
  if (err === "SLUG_RESERVED" || isReservedTenantLabel(slug)) {
    return { available: false, reason: "SLUG_RESERVED" };
  }
  const existing = store().bySlug.get(slug);
  if (
    existing &&
    (!options?.organisationId ||
      existing.organisationId !== options.organisationId)
  ) {
    return { available: false, reason: "SLUG_TAKEN" };
  }
  return { available: true };
}

export function getDraftBySlug(
  slug: string,
): DomainServicesDraftTenant | null {
  return store().bySlug.get(normalizeSlug(slug)) ?? null;
}

export function getDraftByOrganisationId(
  organisationId: string,
): DomainServicesDraftTenant | null {
  const slug = store().byOrgId.get(organisationId);
  if (!slug) return null;
  return store().bySlug.get(slug) ?? null;
}

export function listDraftTenants(): DomainServicesDraftTenant[] {
  return [...store().bySlug.values()].map((d) => ({
    ...d,
    brand: { ...d.brand },
    modules: { ...d.modules },
  }));
}

export function upsertDraftTenant(input: {
  organisationId: string;
  ownerUserId: string;
  slug: string;
  brand: DomainServicesBrandDraft;
  modules: Record<DomainServicesModuleKey, boolean>;
}): DomainServicesDraftTenant {
  const slug = normalizeSlug(input.slug);
  const slugError = validateSlug(slug);
  if (slugError) throw new Error(slugError);
  const brandError = validateBrand(input.brand);
  if (brandError) throw new Error(brandError);
  const modulesError = validateModules(input.modules);
  if (modulesError) throw new Error(modulesError);

  const existingForOrg = getDraftByOrganisationId(input.organisationId);
  const colliding = store().bySlug.get(slug);
  if (colliding && colliding.organisationId !== input.organisationId) {
    throw new Error("SLUG_TAKEN");
  }

  const ts = nowIso();
  if (existingForOrg) {
    if (existingForOrg.slug !== slug) {
      store().bySlug.delete(existingForOrg.slug);
      store().byOrgId.delete(input.organisationId);
    }
    const updated: DomainServicesDraftTenant = {
      ...existingForOrg,
      slug,
      name: input.brand.companyName.trim(),
      brand: { ...input.brand, companyName: input.brand.companyName.trim() },
      modules: { ...input.modules },
      status: "preview",
      updatedAt: ts,
    };
    store().bySlug.set(slug, updated);
    store().byOrgId.set(input.organisationId, slug);
    return { ...updated, brand: { ...updated.brand }, modules: { ...updated.modules } };
  }

  const created: DomainServicesDraftTenant = {
    id: id(),
    slug,
    name: input.brand.companyName.trim(),
    organisationId: input.organisationId,
    ownerUserId: input.ownerUserId,
    status: "preview",
    synthetic: true,
    brand: {
      ...defaultBrandDraft(input.brand.companyName.trim()),
      ...input.brand,
      companyName: input.brand.companyName.trim(),
    },
    modules: { ...defaultModuleFlags(), ...input.modules },
    domainActivation: "NOT_CONFIGURED",
    createdAt: ts,
    updatedAt: ts,
  };
  store().bySlug.set(slug, created);
  store().byOrgId.set(input.organisationId, slug);
  return { ...created, brand: { ...created.brand }, modules: { ...created.modules } };
}
