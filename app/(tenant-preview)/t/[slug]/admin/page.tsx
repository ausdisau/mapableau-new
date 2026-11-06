import Link from "next/link";

import { coverageCareConfig } from "@/lib/config/coverage-care";
import { PROPOSED_COVERAGE_CARE_HOST } from "@/lib/tenancy/tenant-host-policy";
import { getTenantPreviewGate } from "@/lib/tenancy/tenant-preview-policy";

export default async function TenantAdminHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const base = `/t/${slug}/admin`;
  const gate = getTenantPreviewGate();
  const host = coverageCareConfig.host || PROPOSED_COVERAGE_CARE_HOST;

  const cards = [
    {
      href: `${base}/brandos`,
      title: "BrandOS",
      body: "Draft messaging and assets → approval preview. Live publish blocked.",
    },
    {
      href: `${base}/provisioning`,
      title: "Domain readiness",
      body: "Proposed hostname, reserved-host checks, DNS/TLS gates — NOT CONFIGURED.",
    },
    {
      href: `${base}/ndia`,
      title: "NDIA capabilities",
      body: "All protected NDIA capabilities return NOT_AUTHORISED_OR_NOT_CONFIGURED.",
    },
    {
      href: `/t/${slug}/provider/inbox`,
      title: "Provider inbox",
      body: "Review synthetic participant enquiries with status transitions.",
    },
  ] as const;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-[color:var(--cc-olive)]">
        Tenant admin
      </h1>
      <p className="mt-2 text-[color:var(--cc-ink)]/75">
        Brand, catalogue publication flags, claims, and domain readiness for the
        Coverage Care pilot. Platform admins cannot self-activate live hosting or
        read participant enquiries solely by role.
      </p>

      <aside
        className="mt-6 rounded-md border-2 border-amber-700/40 bg-amber-50 px-4 py-4"
        aria-label="Domain activation status"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-900">
          Domain activation — NOT CONFIGURED
        </p>
        <p className="mt-2 text-sm text-amber-950">
          Proposed host <code>{host}</code>. Host rewrite{" "}
          {gate.hostRewriteEnabled ? "allowed when master flag is on" : "gated OFF"}.
          No DNS, TLS, cookie-domain, or Vercel domain attach has been performed.
          Human review required before any activation.
        </p>
      </aside>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <li key={card.href}>
            <Link
              href={card.href}
              className="block h-full rounded-md border border-[color:var(--cc-sage)]/30 bg-white p-5 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
            >
              <h2 className="text-lg font-semibold text-[color:var(--cc-olive)]">
                {card.title}
              </h2>
              <p className="mt-2 text-sm text-[color:var(--cc-ink)]/75">
                {card.body}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
