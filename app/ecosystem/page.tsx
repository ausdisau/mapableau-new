import type { Metadata } from "next";
import Link from "next/link";

import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import {
  ECOSYSTEM_JOURNEYS,
  ECOSYSTEM_PRIMARY_NAV,
  ECOSYSTEM_SERVICES,
  getEcosystemService,
  getJourneyServiceDetails,
  type EcosystemService,
} from "@/lib/ecosystem/service-directory";
import {
  mapablePublicCardClass,
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";

export const metadata: Metadata = {
  title: "MapAble Ecosystem | Access, community and everyday participation",
  description:
    "Explore MapAble Challenges, accessibility, Care, Transport, Employment, Marketplace, AccessiMart, CripSquare and the planned MapAble Day experience.",
};

const stateLabels = {
  "existing-information": "Public information route",
  prototype: "Prototype — check the displayed evidence",
  planned: "Integration planned",
} as const;

function ServiceLink({
  service,
  className,
}: {
  service: EcosystemService;
  className: string;
}) {
  if (!service.href) {
    return <span className="text-slate-600">Not connected yet</span>;
  }
  const content = `Explore ${service.name}`;
  if (service.href.startsWith("https://")) {
    return (
      <a href={service.href} className={className}>
        {content} (official external website)
      </a>
    );
  }
  return (
    <Link href={service.href} className={className}>
      {content}
    </Link>
  );
}

export default function MapAbleEcosystemPage() {
  return (
    <MapAbleCareMarketingShell>
      <div className="min-h-screen bg-white text-[#0C1833]">
        <a
          href="#main-ecosystem"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:ring-4 focus:ring-amber-300"
        >
          Skip to main content
        </a>
        <header className="border-b border-slate-200 bg-[#F6FBFC]">
          <div className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
            <p className={mapablePublicEyebrowClass}>MapAble Ecosystem</p>
            <h1 className={`${mapablePublicTitleClass} mt-3`}>
              Your life. Connected services. Your decisions.
            </h1>
            <p className={mapablePublicLeadClass}>
              Discover places, map access barriers, explore support, plan journeys,
              consider work and find assistive technology in one accessible
              ecosystem. Each service keeps its own safety and consent controls.
            </p>
            <nav
              aria-label="Primary MapAble services"
              className="mt-7 flex flex-wrap gap-3"
            >
              {ECOSYSTEM_PRIMARY_NAV.map((item) => {
                const service = getEcosystemService(item.id);
                if (!service.href) {
                  return (
                    <span
                      key={item.id}
                      className="inline-flex min-h-11 items-center rounded-2xl border border-dashed border-slate-300 px-4 text-sm font-semibold text-slate-600"
                    >
                      {item.label} (planned)
                    </span>
                  );
                }
                if (service.href.startsWith("https://")) {
                  return (
                    <a
                      key={item.id}
                      href={service.href}
                      className={mapablePublicSecondaryButtonClass}
                    >
                      {item.label}
                    </a>
                  );
                }
                return (
                  <Link
                    key={item.id}
                    href={service.href}
                    className={
                      item.id === "explore"
                        ? mapablePublicPrimaryButtonClass
                        : mapablePublicSecondaryButtonClass
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <nav aria-label="Explore this page" className="mt-4 flex flex-wrap gap-3">
              <a href="#journeys" className={mapablePublicSecondaryButtonClass}>
                Explore journeys
              </a>
              <a href="#services" className={mapablePublicSecondaryButtonClass}>
                See all services
              </a>
            </nav>
          </div>
        </header>

        <div
          id="main-ecosystem"
          className={`${mapablePublicPageContainerClass} py-10 sm:py-14`}
        >
          <section aria-labelledby="journey-title" id="journeys">
            <h2 id="journey-title" className="text-2xl font-black sm:text-3xl">
              Start with what you want to do
            </h2>
            <p className="mt-2 max-w-3xl text-slate-700">
              These are suggested journeys, not automated actions. Browsing one
              service does not send your information to another.
            </p>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {ECOSYSTEM_JOURNEYS.map((journey) => (
                <article key={journey.id} className={mapablePublicCardClass}>
                  <h3 className="text-xl font-black">{journey.title}</h3>
                  <p className="mt-2 leading-7 text-slate-700">
                    {journey.description}
                  </p>
                  <ol className="mt-4 list-decimal space-y-3 pl-6">
                    {getJourneyServiceDetails(journey).map((service) => (
                      <li key={service.id} className="pl-1 text-sm leading-6">
                        <span className="font-semibold">{service.name}</span>
                        <span className="ml-2 text-slate-600">
                          ({stateLabels[service.state]})
                        </span>
                        {service.href ? (
                          <div className="mt-1">
                            <ServiceLink
                              service={service}
                              className="inline-flex min-h-11 items-center rounded-lg py-2 font-semibold text-[#005B7F] underline underline-offset-4 focus:outline-none focus:ring-4 focus:ring-amber-300"
                            />
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-4 border-t border-slate-200 pt-3 text-sm leading-6 text-slate-700">
                    {journey.participantControl}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-14" aria-labelledby="services-title" id="services">
            <h2 id="services-title" className="text-2xl font-black sm:text-3xl">
              Connected by design, not by automatic data sharing
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ECOSYSTEM_SERVICES.map((service) => (
                <article key={service.id} className={mapablePublicCardClass}>
                  <h3 className="text-lg font-black">{service.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {service.summary}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-[#005B7F]">
                    {stateLabels[service.state]}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    {service.evidence}
                  </p>
                  <div className="mt-3 text-sm">
                    <ServiceLink
                      service={service}
                      className="inline-flex min-h-11 items-center rounded-lg py-2 font-semibold text-[#005B7F] underline underline-offset-4 focus:outline-none focus:ring-4 focus:ring-amber-300"
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside
            aria-labelledby="assurance-heading"
            className="mt-10 rounded-2xl border border-slate-300 bg-slate-50 p-6"
          >
            <h2 id="assurance-heading" className="text-xl font-black">
              What this hub does not do
            </h2>
            <p className="mt-3 max-w-4xl leading-7">
              It does not publish a community observation, assign workers, book
              travel, send an employment disclosure, share a profile, collect a
              payment, confirm worker screening or determine NDIS funding.
              MapAble Day, CripSquare account federation and AccessiMart
              transactions remain separate development and approval tasks.
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-flex min-h-11 items-center rounded-lg py-2 font-semibold text-[#005B7F] underline underline-offset-4 focus:outline-none focus:ring-4 focus:ring-amber-300"
            >
              Contact MapAble for accessible human assistance
            </Link>
          </aside>
        </div>
      </div>
    </MapAbleCareMarketingShell>
  );
}
