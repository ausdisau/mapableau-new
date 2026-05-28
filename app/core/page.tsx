import {
  CoreCapabilityStrip,
  CoreEcosystemCard,
  CoreHubCard,
  CorePageHeader,
  CorePillarCard,
  CoreQuickActions,
  CoreSection,
} from "@/components/core";
import { CORE_CAPABILITIES, CORE_CAPABILITIES_SECTION } from "@/lib/core-ui/core-capabilities";
import { CORE_ECOSYSTEM_APPS, CORE_ECOSYSTEM_SECTION } from "@/lib/core-ui/ecosystem";
import { CORE_HUB_HERO, CORE_HUB_SECTIONS } from "@/lib/core-ui/navigation";
import { CORE_PILLARS_SECTION, CORE_SERVICE_PILLARS } from "@/lib/core-ui/pillars";

export const metadata = {
  title: "MapAble Core",
  description:
    "One account for care, transport and employment — billing, messaging and support in a single accessible hub.",
};

export default function CoreHubPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
      <CorePageHeader
        eyebrow={CORE_HUB_HERO.eyebrow}
        centered
        title={
          <>
            {CORE_HUB_HERO.titleLead}{" "}
            <span className="text-primary">{CORE_HUB_HERO.titleAccent}</span>
          </>
        }
        description={CORE_HUB_HERO.description}
      >
        <CoreQuickActions />
      </CorePageHeader>

      <CoreSection
        title={CORE_CAPABILITIES_SECTION.title}
        description={CORE_CAPABILITIES_SECTION.description}
      >
        <CoreCapabilityStrip capabilities={CORE_CAPABILITIES} />
      </CoreSection>

      <CoreSection
        title={CORE_PILLARS_SECTION.title}
        description={CORE_PILLARS_SECTION.description}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {CORE_SERVICE_PILLARS.map((pillar) => (
            <CorePillarCard key={pillar.id} pillar={pillar} />
          ))}
        </div>
      </CoreSection>

      <CoreSection
        id={CORE_ECOSYSTEM_SECTION.id}
        title={CORE_ECOSYSTEM_SECTION.title}
        description={CORE_ECOSYSTEM_SECTION.description}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CORE_ECOSYSTEM_APPS.map((app) => (
            <CoreEcosystemCard key={app.id} app={app} />
          ))}
        </div>
      </CoreSection>

      {CORE_HUB_SECTIONS.map((section) => (
        <CoreSection
          key={section.title}
          id={section.title === "Public accountability" ? "civic" : undefined}
          title={section.title}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.links.map((link) => (
              <CoreHubCard
                key={link.href}
                href={link.href}
                title={link.label}
                description={link.description}
                status="live"
              />
            ))}
          </div>
        </CoreSection>
      ))}

      <footer className="border-t border-border/60 pt-8 text-center text-sm text-muted-foreground">
        <p className="mx-auto max-w-2xl">{CORE_HUB_HERO.socialEnterpriseNote}</p>
      </footer>
    </div>
  );
}
