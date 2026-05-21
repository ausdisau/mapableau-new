import Link from "next/link";

import { CoreHubCard } from "@/components/core/CoreHubCard";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { CORE_HUB_SECTIONS } from "@/lib/core-ui/navigation";

export const metadata = {
  title: "MapAble Core",
  description: "Disability support, transport and public accountability in one platform.",
};

export default function CoreHubPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
      <CorePageHeader
        title="MapAble Core"
        description="Your dashboard for care and transport, plus public transparency and accountability tools. Plain language, accessible design, and consent-aware by default."
      >
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/login"
            className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            Go to dashboard
          </Link>
        </div>
      </CorePageHeader>

      {CORE_HUB_SECTIONS.map((section) => (
        <section key={section.title} id={section.title === "Public accountability" ? "civic" : undefined}>
          <h2 className="font-heading text-xl font-semibold">{section.title}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.links.map((link) => (
              <CoreHubCard
                key={link.href}
                href={link.href}
                title={link.label}
                description={link.description}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
