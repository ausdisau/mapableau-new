import Link from "next/link";

import { canonicalAlternate } from "@/lib/config/canonical-url";
import { homeLivingConfig } from "@/lib/config/abilitypay-home-living";

export const metadata = {
  title: "MapAble Home",
  description:
    "Find homes, compare accessibility evidence, and decide for yourself. MapAble Home does not choose a property for you.",
  alternates: canonicalAlternate("/home"),
};

export default function MapAbleHomePage() {
  const discoveryOn =
    homeLivingConfig.enabled && homeLivingConfig.discoveryEnabled;

  return (
    <main className="mx-auto max-w-4xl space-y-10 px-4 py-12">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          MapAble Home
        </p>
        <h1 className="font-heading text-4xl font-bold text-slate-900">
          Find a home. Understand the evidence. Decide for yourself.
        </h1>
        <p className="max-w-2xl text-lg text-slate-700">
          MapAble Home helps you discover housing options, review accessibility
          evidence, and compare homes against requirements you choose. Housing
          and support stay separate. MapAble does not decide suitability or NDIS
          eligibility.
        </p>
      </header>

      <section
        aria-labelledby="status-heading"
        className="grid gap-4 sm:grid-cols-3"
      >
        <h2 id="status-heading" className="sr-only">
          Feature status
        </h2>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <h3 className="font-semibold text-emerald-900">Available now</h3>
          <p className="mt-2 text-sm text-emerald-900">
            Search published homes, inspect evidence (including UNKNOWN),
            shortlist, and compare up to four properties.
          </p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-semibold text-amber-900">In development</h3>
          <p className="mt-2 text-sm text-amber-900">
            Descriptive home technology profiles and Marketplace product
            exploration for a home you choose.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-semibold text-slate-800">Proposed</h3>
          <p className="mt-2 text-sm text-slate-700">
            Live smart-home control, Matter/Alexa/Google device operation, and
            automated matching are not part of this release.
          </p>
        </div>
      </section>

      <section aria-labelledby="actions-heading" className="space-y-3">
        <h2 id="actions-heading" className="text-xl font-semibold">
          What you can do
        </h2>
        {discoveryOn ? (
          <ul className="list-disc space-y-2 pl-5 text-slate-800">
            <li>
              <Link className="underline" href="/home/find">
                Find a home
              </Link>
            </li>
            <li>
              <Link className="underline" href="/home/compare">
                Compare homes
              </Link>
            </li>
            <li>
              <Link className="underline" href="/participant/home-and-living">
                My home requirements
              </Link>
            </li>
            <li>
              <Link
                className="underline"
                href="/participant/home-and-living/shortlist"
              >
                My shortlist
              </Link>
            </li>
          </ul>
        ) : (
          <p className="rounded-md border border-slate-300 bg-slate-50 p-4 text-slate-800">
            MapAble Home discovery is not enabled in this environment yet. Your
            Home and Living requirements profile remains available under
            participant settings.
          </p>
        )}
      </section>

      <aside className="rounded-md border border-slate-300 p-4 text-sm text-slate-700">
        AccessiSpace was a historical development prototype. Useful concepts
        were absorbed into MapAble Home. Homes are not Marketplace products.
        Property marketing claims stay unverified until separately recorded
        evidence says otherwise.
      </aside>
    </main>
  );
}
