import {
  DOMAIN_SERVICES_MODULE_KEYS,
  type DomainServicesBrandDraft,
  type DomainServicesModuleKey,
} from "@/lib/tenancy/domain-services-brand";
import { isReservedTenantLabel } from "@/lib/tenancy/tenant-host-policy";

export const WIZARD_STEPS = ["account", "modules", "branding"] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

export type WizardValidationError =
  | "SLUG_REQUIRED"
  | "SLUG_INVALID"
  | "SLUG_RESERVED"
  | "COMPANY_REQUIRED"
  | "EMAIL_INVALID"
  | "MODULES_REQUIRED";

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/;

export function normalizeSlug(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export function validateSlug(raw: string): WizardValidationError | null {
  const slug = normalizeSlug(raw);
  if (!slug) return "SLUG_REQUIRED";
  if (!SLUG_PATTERN.test(slug) || slug.includes("--")) return "SLUG_INVALID";
  if (isReservedTenantLabel(slug)) return "SLUG_RESERVED";
  // Also block known static tenants.
  if (slug === "coveragecare" || slug === "coverage-care" || slug === "acme-care") {
    return "SLUG_RESERVED";
  }
  return null;
}

export function validateBrand(
  brand: DomainServicesBrandDraft,
): WizardValidationError | null {
  if (!brand.companyName.trim()) return "COMPANY_REQUIRED";
  if (brand.supportEmail.trim()) {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brand.supportEmail.trim());
    if (!ok) return "EMAIL_INVALID";
  }
  return null;
}

export function validateModules(
  modules: Record<DomainServicesModuleKey, boolean>,
): WizardValidationError | null {
  const anyOn = DOMAIN_SERVICES_MODULE_KEYS.some((key) => modules[key]);
  if (!anyOn) return "MODULES_REQUIRED";
  return null;
}

export function canAdvanceFrom(
  step: WizardStep,
  input: {
    slug: string;
    brand: DomainServicesBrandDraft;
    modules: Record<DomainServicesModuleKey, boolean>;
  },
): WizardValidationError | null {
  switch (step) {
    case "account": {
      const slugError = validateSlug(input.slug);
      if (slugError) return slugError;
      if (!input.brand.companyName.trim()) return "COMPANY_REQUIRED";
      return null;
    }
    case "modules":
      return validateModules(input.modules);
    case "branding":
      return validateBrand(input.brand);
    default: {
      const _exhaustive: never = step;
      return _exhaustive;
    }
  }
}

export function nextStep(step: WizardStep): WizardStep | null {
  const index = WIZARD_STEPS.indexOf(step);
  if (index < 0 || index >= WIZARD_STEPS.length - 1) return null;
  return WIZARD_STEPS[index + 1] ?? null;
}

export function previousStep(step: WizardStep): WizardStep | null {
  const index = WIZARD_STEPS.indexOf(step);
  if (index <= 0) return null;
  return WIZARD_STEPS[index - 1] ?? null;
}

export function proposedHostname(
  slug: string,
  hostSuffix = "mapable.com.au",
): string {
  return `${normalizeSlug(slug)}.${hostSuffix}`;
}
