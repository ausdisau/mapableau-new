import Link from "next/link";

import { CoverageCareDisabledState } from "@/components/coverage-care/DisabledState";
import { coverageCareConfig } from "@/lib/config/coverage-care";
import { resolveCoverageCareProviderAdmin } from "@/lib/coverage-care/demo-actor";
import { isCoverageCareSurfaceEnabled } from "@/lib/coverage-care/flag-gate";

export default async function ProviderAdminPage() {
  if (!isCoverageCareSurfaceEnabled()) {
    return <CoverageCareDisabledState />;
  }

  const actor = await resolveCoverageCareProviderAdmin();
  if (!actor) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold text-[color:var(--cc-olive)]">
          Provider administrator role required
        </h1>
      </div>
    );
  }

  const links = [
    {
      href: "/coverage-care/provider/inbox",
      label: "Enquiry inbox",
      enabled: true,
    },
    {
      href: "/coverage-care/admin/brandos",
      label: "BrandOS management",
      enabled: coverageCareConfig.brandOsEnabled,
    },
    {
      href: "/coverage-care/admin/provisioning",
      label: "Tenant provisioning preview",
      enabled: coverageCareConfig.provisioningPreviewEnabled,
    },
    {
      href: "/coverage-care/admin/ndia",
      label: "NDIA Integration Gateway readiness",
      enabled: true,
    },
  ] as const;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-[color:var(--cc-olive)]">
        Provider administrator workspace
      </h1>
      <p className="mt-2 text-[color:var(--cc-ink)]/75">
        Role-enforced Coverage Care admin surfaces. Sub-features remain
        flag-gated and fail-closed.
      </p>
      <ul className="mt-8 space-y-3">
        {links.map((item) => (
          <li key={item.href}>
            {item.enabled ? (
              <Link
                href={item.href}
                className="flex min-h-11 items-center rounded-md border border-[color:var(--cc-sage)]/30 bg-white px-4 font-medium text-[color:var(--cc-olive)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
              >
                {item.label}
              </Link>
            ) : (
              <span className="flex min-h-11 items-center rounded-md border border-dashed border-[color:var(--cc-olive)]/30 px-4 text-[color:var(--cc-ink)]/60">
                {item.label} — flag disabled
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
