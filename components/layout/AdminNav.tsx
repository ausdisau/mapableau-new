"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/app/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/participants", label: "Participants" },
  { href: "/admin/organisations", label: "Organisations" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/consents", label: "Consents" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/audit-events", label: "Audit events" },
  { href: "/admin/operations", label: "Operations" },
  { href: "/admin/service-ops", label: "Service ops" },
  { href: "/admin/care", label: "Care" },
  { href: "/admin/transport", label: "Transport" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/workers", label: "Workers" },
  { href: "/admin/vehicles", label: "Vehicles" },
  { href: "/admin/drivers", label: "Drivers" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/job-applications", label: "Applications" },
  { href: "/admin/provider-capacity", label: "Capacity" },
  { href: "/admin/matching", label: "Matching" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/incidents", label: "Incidents" },
  { href: "/admin/contracts", label: "Contracts" },
  { href: "/admin/ai-matching", label: "AI matching" },
  { href: "/admin/fairness", label: "Fairness" },
  { href: "/admin/reporting", label: "Reporting" },
  { href: "/admin/integrations", label: "Integrations" },
  { href: "/admin/platform-gaps", label: "Platform gaps" },
  { href: "/admin/readiness", label: "Readiness" },
  { href: "/admin/ndia-readiness", label: "NDIA readiness" },
  { href: "/admin/compliance", label: "Compliance" },
  { href: "/admin/security-readiness", label: "Security" },
  { href: "/admin/launch-readiness", label: "Launch" },
  { href: "/admin/dispatch", label: "Dispatch" },
  { href: "/admin/provider-quality", label: "Quality" },
  { href: "/admin/ai-governance", label: "AI gov" },
  { href: "/admin/partner-sandbox", label: "Sandbox" },
  { href: "/admin/board-reporting", label: "Board" },
  { href: "/admin/community-governance", label: "Governance" },
  { href: "/admin/payment-reconciliation", label: "Reconcile" },
  { href: "/admin/operator-dispatch", label: "Op dispatch" },
  { href: "/admin/mobile-release", label: "Mobile" },
  { href: "/admin/provider-onboarding", label: "Onboarding" },
  { href: "/admin/plan-manager-pilot", label: "PM pilot" },
  { href: "/admin/tenants", label: "Tenants" },
  { href: "/admin/public-beta", label: "Beta" },
  { href: "/admin/social-impact", label: "Impact" },
  { href: "/admin/scale-plan", label: "Scale" },
  { href: "/admin/ndia-pilot", label: "NDIA pilot" },
  { href: "/admin/app-store-release", label: "App store" },
  { href: "/admin/transport-network", label: "Network" },
  { href: "/admin/settlement-batches", label: "Settlement" },
  { href: "/admin/national-insights", label: "National" },
  { href: "/admin/api-versioning", label: "API ver" },
  { href: "/admin/sla-reporting", label: "SLA" },
  { href: "/admin/grant-reporting", label: "Grants" },
  { href: "/admin/security-audit-packs", label: "Audit" },
  { href: "/admin/compliance-renewals", label: "Renewals" },
  { href: "/admin/data-trust-council", label: "Trust" },
  { href: "/admin/partner-marketplace", label: "Marketplace" },
  { href: "/admin/accreditation-public", label: "Accred pub" },
  { href: "/admin/ai-monitoring", label: "AI monitor" },
  { href: "/admin/public-transparency", label: "Transparency" },
  { href: "/admin/government-portals", label: "Gov portal" },
  { href: "/admin/dr-exercises", label: "DR auto" },
  { href: "/admin/national-rollout", label: "Rollout" },
  { href: "/admin/partner-billing", label: "Partner billing" },
  { href: "/admin/billing", label: "Core billing" },
  { href: "/admin/partner-api-program", label: "API program" },
  { href: "/admin/assessor-network", label: "Assessors" },
  { href: "/admin/public-decisions", label: "Decisions" },
  { href: "/admin/personal-data-vault", label: "Vault" },
  { href: "/admin/research-safe-room", label: "Research" },
  { href: "/admin/provider-benchmarking", label: "Benchmark" },
  { href: "/admin/governance-charter", label: "Charter" },
  { href: "/admin/i18n", label: "i18n" },
  { href: "/admin/longitudinal-impact", label: "Longitudinal" },
  { href: "/admin/api-certification", label: "API cert" },
  { href: "/admin/algorithm-register", label: "Algorithms" },
  { href: "/admin/oversight-board", label: "Oversight" },
  { href: "/admin/privacy-analytics", label: "PP analytics" },
  { href: "/admin/federated-research", label: "Federated" },
  { href: "/admin/provider-academy", label: "Academy" },
  { href: "/admin/data-trust-reports", label: "Trust report" },
  { href: "/admin/sustainability-plan", label: "Sustainability" },
  { href: "/admin/long-term-outcomes", label: "Outcomes" },
  { href: "/admin/national-accountability", label: "Accountability" },
  { href: "/admin/constitutional-safeguards", label: "Safeguards" },
  { href: "/admin/community-membership", label: "Membership" },
  { href: "/admin/transport-investment", label: "Investment" },
  { href: "/admin/certified-api-ecosystem", label: "API ecosystem" },
  { href: "/admin/research-federation-nodes", label: "Fed research" },
  { href: "/admin/institutional-continuity", label: "Continuity" },
  { href: "/admin/civic-audit-index", label: "Civic audit" },
  { href: "/admin/federated-accountability", label: "Fed partners" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/documents", label: "Documents" },
  { href: "/admin/invoices", label: "Invoices" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="border-b border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="mb-3 flex items-center justify-between gap-4">
          <Link href="/admin" className="font-heading text-lg font-bold">
            MapAble Admin
          </Link>
          <div className="flex gap-3 text-sm">
            <Link
              href="/core"
              className="text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              Core hub
            </Link>
            <Link
              href="/dashboard"
              className="text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              Dashboard
            </Link>
          </div>
        </div>
        <ul className="flex flex-wrap gap-2">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={
                  pathname === link.href ? "page" : undefined
                }
                className={cn(
                  "inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  pathname === link.href ||
                    (link.href !== "/admin" && pathname.startsWith(link.href))
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
