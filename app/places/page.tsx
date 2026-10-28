import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { listPublishedPlaces } from "@/lib/access/map/access-place-service";
import {
  isPlacesPrototypeEnabled,
  normalisePlacesPreviewOrigin,
} from "@/lib/places/integration";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MapAble Places — controlled community prototype",
  description:
    "Controlled demonstration linking MapAble published place discovery with the privacy-first MapAble Places and CripSquare concept.",
  robots: { index: false, follow: false },
};

const linkStyle =
  "inline-flex min-h-11 items-center rounded-xl border-2 border-[#005B7F] px-5 py-3 font-bold text-[#005B7F] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2";

export default async function PlacesGatewayPage() {
  if (!isPlacesPrototypeEnabled()) notFound();

  // This gateway never reads check-ins, community posts, device memories or
  // participant accessibility preferences. The prototype runs separately.
  const publishedPlaces = await listPublishedPlaces(12).catch(() => null);
  const previewOrigin = normalisePlacesPreviewOrigin(
    process.env.MAPABLE_PLACES_PREVIEW_URL,
  );

  return (
    <MapAbleCareMarketingShell>
      <div className="mx-auto max-w-6xl space-y-10 px-5 py-12 text-[#0C1833]">
        <header className="rounded-3xl bg-[#06344D] px-6 py-10 text-white sm:px-10">
          <p className="text-sm font-bold uppercase tracking-wider text-[#D9FBFF]">
            MapAble Labs · Controlled prototype
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            MapAble Places: discover, contribute, connect
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white">
            A privacy-first place discovery and community participation
            experience connected to MapAble Access and inspired by CripSquare.
            This page is a development entrypoint, not a public check-in service.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#E6F3F7]">
            No attendance tracking, venue partnership, live CripSquare posts or
            accessibility certification is implied.
          </p>
        </header>

        <section aria-labelledby="places-journeys" className="space-y-5">
          <h2 id="places-journeys" className="text-2xl font-black">How the experience works</h2>
          <div className="grid gap-5 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-300 bg-white p-5">
              <h3 className="text-xl font-bold">1. Discover</h3>
              <p className="mt-3 text-base leading-7">
                Explore canonical MapAble places and read published accessibility
                information with its sources and limitations.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-300 bg-white p-5">
              <h3 className="text-xl font-bold">2. Remember privately</h3>
              <p className="mt-3 text-base leading-7">
                Use the separate Expo prototype to save places and private notes.
                It requires no GPS or proof of visiting.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-300 bg-white p-5">
              <h3 className="text-xl font-bold">3. Connect thoughtfully</h3>
              <p className="mt-3 text-base leading-7">
                Test accessibility-report authoring and hypothetical CripSquare
                activities. Drafts are not published or sent to other members.
              </p>
            </article>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/access" className={linkStyle}>Browse MapAble Access</Link>
            {previewOrigin ? (
              <a href={previewOrigin} className={linkStyle} rel="noopener noreferrer">
                Open separate Places prototype
                <span className="sr-only"> (external web application)</span>
              </a>
            ) : (
              <p className="w-full text-sm text-slate-700">
                Interactive Expo preview has not been configured on this host.
                The working app is available in the repository at <code>apps/places</code>.
              </p>
            )}
          </div>
        </section>

        <section aria-labelledby="places-directory" className="space-y-5">
          <div>
            <h2 id="places-directory" className="text-2xl font-black">
              Places from the existing MapAble directory
            </h2>
            <p className="mt-2 max-w-3xl text-slate-700">
              These entries are read from the canonical published-place service.
              Directory presence does not prove a step-free route, a usable
              accessible toilet or suitable travel connections.
            </p>
          </div>
          {publishedPlaces === null ? (
            <p role="status" className="rounded-xl bg-amber-50 p-5 text-amber-950">
              The published-place service is currently unavailable. The
              separate offline Expo demonstration can still be used.
            </p>
          ) : publishedPlaces.length === 0 ? (
            <p role="status" className="rounded-xl bg-slate-100 p-5">
              No published places are available in this environment.
            </p>
          ) : (
            <ul className="grid list-none gap-4 sm:grid-cols-2">
              {publishedPlaces.map((place) => (
                <li key={place.id} className="rounded-2xl border border-slate-300 bg-white p-5">
                  <p className="text-sm font-semibold text-[#005B7F]">
                    {place.category.replace(/_/g, " ")} · {place.suburb || "Suburb not listed"}
                  </p>
                  <h3 className="mt-2 text-xl font-bold">{place.name}</h3>
                  <p className="my-3 text-sm text-slate-600">
                    Detailed access evidence must be checked on the place profile.
                  </p>
                  <Link
                    className="inline-flex min-h-11 items-center font-bold text-[#005B7F] underline focus-visible:outline-4"
                    href={`/access/places/${encodeURIComponent(place.id)}`}
                  >
                    Review published place details
                    <span className="sr-only"> for {place.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="places-safety" className="rounded-2xl border border-slate-300 bg-[#F2F8FA] p-6">
          <h2 id="places-safety" className="text-xl font-black">Accessibility and privacy safeguards</h2>
          <p className="mt-3 max-w-4xl leading-7">
            The mobile prototype uses local device storage for private place
            memories and community drafts. That storage is not encrypted and
            should not contain sensitive personal information. Its access
            reports and community posts have no live publishing backend.
          </p>
          <p className="mt-3 max-w-4xl leading-7">
            WCAG 2.2 AA and ATAG 2.0 remain test targets, not certified
            conformance claims. Human review, safeguarding and genuine
            CripSquare authentication are required before live social features.
          </p>
        </section>
      </div>
    </MapAbleCareMarketingShell>
  );
}
