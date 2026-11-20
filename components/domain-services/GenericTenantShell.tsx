import Link from "next/link";
import type { ReactNode } from "react";

import { DomainReadinessCard } from "@/components/domain-services/DomainReadinessCard";
import {
  DOMAIN_SERVICES_DEFAULT_BRAND,
  type DomainServicesBrandDraft,
  type DomainServicesModuleKey,
} from "@/lib/tenancy/domain-services-brand";

const MODULE_LINKS: {
  key: DomainServicesModuleKey;
  href: (slug: string) => string;
  label: string;
}[] = [
  { key: "landing", href: (s) => `/t/${s}`, label: "Home" },
  { key: "services", href: (s) => `/t/${s}/services`, label: "Services" },
  { key: "enquire", href: (s) => `/t/${s}/enquire`, label: "Enquire" },
  { key: "portal", href: (s) => `/t/${s}/portal`, label: "Portal" },
  { key: "contact", href: (s) => `/t/${s}/contact`, label: "Contact" },
  { key: "privacy", href: (s) => `/t/${s}/privacy`, label: "Privacy" },
  { key: "admin", href: (s) => `/t/${s}/admin`, label: "Admin" },
];

export function GenericTenantShell({
  slug,
  brand,
  modules,
  children,
}: {
  slug: string;
  brand: DomainServicesBrandDraft;
  modules: Record<DomainServicesModuleKey, boolean>;
  children: ReactNode;
}) {
  const primary = brand.primaryColor || DOMAIN_SERVICES_DEFAULT_BRAND.colors.primary;
  const enabledLinks = MODULE_LINKS.filter((m) => modules[m.key]);

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(180deg, ${DOMAIN_SERVICES_DEFAULT_BRAND.colors.surface} 0%, #ffffff 40%)`,
        color: DOMAIN_SERVICES_DEFAULT_BRAND.colors.ink,
      }}
    >
      <div
        role="status"
        className="border-b border-amber-800/20 bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-950"
      >
        {DOMAIN_SERVICES_DEFAULT_BRAND.syntheticBanner}
      </div>
      <header className="border-b border-black/5 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {DOMAIN_SERVICES_DEFAULT_BRAND.poweredBy}
            </p>
            <p className="text-xl font-bold" style={{ color: primary }}>
              {brand.companyName || "Provider draft"}
            </p>
            {brand.tagline ? (
              <p className="text-sm text-muted-foreground">{brand.tagline}</p>
            ) : null}
          </div>
          <nav aria-label="Tenant modules" className="flex flex-wrap gap-3 text-sm">
            {enabledLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href(slug)}
                className="font-medium underline-offset-4 hover:underline"
                style={{ color: primary }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <DomainReadinessCard slug={slug} companyName={brand.companyName} />
        {children}
      </main>
      <footer className="border-t border-black/5 px-4 py-6 text-center text-xs text-muted-foreground">
        Draft white-label preview · {DOMAIN_SERVICES_DEFAULT_BRAND.poweredBy}
      </footer>
    </div>
  );
}
