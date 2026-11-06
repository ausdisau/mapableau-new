import { domainServicesConfig } from "@/lib/config/domain-services";
import { proposedHostname } from "@/lib/tenancy/domain-services-wizard-model";

export function DomainReadinessCard({
  slug,
  companyName,
}: {
  slug: string;
  companyName?: string;
}) {
  const host = proposedHostname(slug, domainServicesConfig.proposedHostSuffix);

  return (
    <section
      aria-labelledby="domain-readiness-heading"
      className="rounded-xl border border-amber-700/30 bg-amber-50 px-5 py-4 text-amber-950"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
        Domain readiness
      </p>
      <h2
        id="domain-readiness-heading"
        className="mt-1 text-lg font-semibold text-amber-950"
      >
        NOT CONFIGURED
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-amber-950/90">
        {companyName ? `${companyName}: ` : null}
        Proposed hostname <span className="font-mono">{host}</span> is
        branding-only. Live DNS, TLS, Vercel domain attach, and multi-host
        cookies remain blocked until human operations activates this tenant.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-950/85">
        <li>No automatic subdomain provisioning</li>
        <li>No cPanel / partnerconsole commerce</li>
        <li>Preview available at /t/{slug} only</li>
      </ul>
    </section>
  );
}
