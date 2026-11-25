export const DOMAIN_SERVICES_DEFAULT_BRAND = {
  poweredBy: "Powered by MapAble",
  syntheticBanner: "SYNTHETIC DEMO — NOT LIVE",
  tagline: "Your brand. Your services. Hosted on MapAble Domain Services.",
  colors: {
    primary: "#0F4C5C",
    accent: "#5B8C5A",
    surface: "#F5F7F6",
    ink: "#1A2421",
  },
} as const;

export const DOMAIN_SERVICES_MODULE_KEYS = [
  "landing",
  "services",
  "enquire",
  "portal",
  "contact",
  "privacy",
  "admin",
] as const;

export type DomainServicesModuleKey =
  (typeof DOMAIN_SERVICES_MODULE_KEYS)[number];

export type DomainServicesBrandDraft = {
  companyName: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  supportEmail: string;
  supportPhone: string;
};

export function defaultBrandDraft(
  companyName = "",
): DomainServicesBrandDraft {
  return {
    companyName,
    tagline: DOMAIN_SERVICES_DEFAULT_BRAND.tagline,
    logoUrl: "",
    primaryColor: DOMAIN_SERVICES_DEFAULT_BRAND.colors.primary,
    supportEmail: "",
    supportPhone: "",
  };
}

export function defaultModuleFlags(): Record<DomainServicesModuleKey, boolean> {
  return {
    landing: true,
    services: true,
    enquire: true,
    portal: true,
    contact: true,
    privacy: true,
    admin: true,
  };
}
