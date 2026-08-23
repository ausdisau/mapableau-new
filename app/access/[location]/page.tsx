import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

import { DEMO_ACCESS_PLACES } from "@/lib/demo/accessibility-places";
import { getLocalAccessPage, LOCAL_ACCESS_LOCATIONS } from "@/lib/demo/local-access-pages";
import { DEMO_PROVIDERS } from "@/lib/demo/providers";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicCardClass,
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";

type PageProps = {
  params: Promise<{ location: string }>;
};

export function generateStaticParams() {
  return LOCAL_ACCESS_LOCATIONS.map((page) => ({ location: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { location } = await params;
  const page = getLocalAccessPage(location);
  if (!page) return { title: "Local access | MapAble" };
  return {
    title: `Accessible places and supports in ${page.location} | MapAble`,
    description: page.intro,
  };
}

export default async function LocalAccessPage({ params }: PageProps) {
  const { location } = await params;
  const page = getLocalAccessPage(location);
  if (!page) notFound();

  const places = DEMO_ACCESS_PLACES.filter((place) =>
    page.featuredPlaceSlugs.includes(place.slug),
  );
  const providers = DEMO_PROVIDERS.filter((provider) =>
    provider.suburbsServed.some(
      (suburb) =>
        suburb.toLowerCase().includes(page.location.toLowerCase()) ||
        page.location.toLowerCase().includes(suburb.toLowerCase().split(" ")[0] ?? ""),
    ),
  ).slice(0, 2);

  return (
    <article className="bg-white text-[#0C1833]">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[#F6FBFC]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-64 w-64 rounded-full bg-[#F8C51C]/25 blur-3xl"
        />
        <div
          className={`${mapablePublicPageContainerClass} relative py-14 sm:py-20`}
        >
          <p className={mapablePublicEyebrowClass}>
            Local Access Guides · {page.state}
          </p>
          <h1 className={`${mapablePublicTitleClass} mt-3`}>
            Accessible places and supports in {page.location}
          </h1>
          <p className={mapablePublicLeadClass}>{page.intro}</p>
          <p className="mt-4 text-sm font-semibold text-slate-600">
            Demo listings are labelled. Confirm critical access needs before
            you travel.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/guides" className={mapablePublicPrimaryButtonClass}>
              All Local Access Guides
            </Link>
            <Link
              href="/accessibility-map"
              className={mapablePublicSecondaryButtonClass}
            >
              Search places
            </Link>
            <Link href="/providers" className={mapablePublicSecondaryButtonClass}>
              Filter providers
            </Link>
          </div>
        </div>
      </section>

      <div className={`${mapablePublicPageContainerClass} space-y-10 py-12 sm:py-16`}>
        <section aria-labelledby="featured-heading">
          <h2 id="featured-heading" className="text-2xl font-black">
            Featured accessible places
          </h2>
          {places.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">
              No featured demo places yet for this location. Help map the area.
            </p>
          ) : (
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {places.map((place) => (
                <li key={place.id} className={mapablePublicCardClass}>
                  <h3 className="font-black">{place.name}</h3>
                  <p className="text-sm text-slate-600">
                    {place.suburb} · {place.tier} · score {place.accessScore}
                  </p>
                  <Link
                    href={`/accessibility-map/${place.slug}`}
                    className={`mt-3 inline-flex min-h-11 items-center text-sm font-bold text-[#005B7F] underline ${mapableCareFocusRing}`}
                  >
                    View access details
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="providers-heading">
          <h2 id="providers-heading" className="text-2xl font-black">
            Provider availability teaser
          </h2>
          {providers.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">
              Browse the full provider directory for nearby availability signals.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {providers.map((provider) => (
                <li key={provider.id} className={`${mapablePublicCardClass} text-sm`}>
                  <p className="font-bold">{provider.name}</p>
                  <p>
                    {provider.earliestAvailability} · Evidence{" "}
                    {provider.evidenceStatus}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/providers"
            className={`mt-3 inline-flex min-h-11 items-center text-sm font-bold text-[#005B7F] underline ${mapableCareFocusRing}`}
          >
            Open provider directory
          </Link>
        </section>

        <section
          aria-labelledby="transport-heading"
          className={`${mapablePublicCardClass} bg-[#F6FBFC]`}
        >
          <h2 id="transport-heading" className="text-xl font-black">
            Transport planning teaser
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Plan accessible transport to venues in {page.location} with buffers
            and support worker meeting options.
          </p>
          <Link
            href="/journey-planner"
            className={`${mapablePublicPrimaryButtonClass} mt-4`}
          >
            Open journey planner
          </Link>
        </section>

        <section aria-labelledby="mapping-heading">
          <h2 id="mapping-heading" className="text-xl font-black">
            Community mapping
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Help improve {page.focus} coverage in {page.location}.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href="/mapping-days"
              className={`font-bold text-[#005B7F] underline ${mapableCareFocusRing}`}
            >
              Join a mapping day
            </Link>
            <Link
              href="/add-access-info"
              className={`font-bold text-[#005B7F] underline ${mapableCareFocusRing}`}
            >
              Add access info
            </Link>
          </div>
        </section>

        <section aria-labelledby="gaps-heading">
          <h2 id="gaps-heading" className="text-xl font-black">
            Local access gaps / unknowns
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {page.gaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-black">
            Resources and FAQs
          </h2>
          <div className="mt-4 space-y-3">
            {page.faqs.map((faq) => (
              <details key={faq.question} className={mapablePublicCardClass}>
                <summary className="min-h-11 cursor-pointer font-semibold">
                  {faq.question}
                </summary>
                <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
          <p className="mt-4 text-sm">
            Also see{" "}
            <Link href="/resources" className="font-semibold text-[#005B7F] underline">
              Resources
            </Link>{" "}
            and{" "}
            <Link href="/guides" className="font-semibold text-[#005B7F] underline">
              Local Access Guides
            </Link>
            .
          </p>
        </section>

        <p className="text-sm text-slate-600" role="note">
          Access information changes and should be confirmed before travelling.
        </p>
      </div>
    </article>
  );
}
