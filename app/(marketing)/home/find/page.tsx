import Link from "next/link";

import { canonicalAlternate } from "@/lib/config/canonical-url";
import { homeLivingConfig } from "@/lib/config/abilitypay-home-living";
import {
  HomeDiscoveryDisabledError,
  searchPublishedProperties,
} from "@/lib/home-living/discovery/property-discovery-service";

export const metadata = {
  title: "Find a home | MapAble Home",
  description:
    "Search published homes and vacancies. Accessibility evidence is shown with status, including UNKNOWN.",
  alternates: canonicalAlternate("/home/find"),
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function FindHomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const suburb =
    typeof params.suburb === "string" ? params.suburb : undefined;
  const propertyType =
    typeof params.propertyType === "string" ? params.propertyType : undefined;
  const bedroomCountRaw =
    typeof params.bedrooms === "string" ? Number(params.bedrooms) : undefined;
  const bedroomCount =
    typeof bedroomCountRaw === "number" && Number.isFinite(bedroomCountRaw)
      ? bedroomCountRaw
      : undefined;

  let properties: Awaited<ReturnType<typeof searchPublishedProperties>> = [];
  let disabled = !(
    homeLivingConfig.enabled && homeLivingConfig.discoveryEnabled
  );
  let errorMessage: string | null = null;

  if (!disabled) {
    try {
      properties = await searchPublishedProperties({
        suburb,
        propertyType,
        bedroomCount,
      });
    } catch (error) {
      if (error instanceof HomeDiscoveryDisabledError) disabled = true;
      else errorMessage = "Unable to load homes right now.";
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <p className="text-sm">
          <Link href="/home" className="underline">
            MapAble Home
          </Link>
        </p>
        <h1 className="font-heading text-3xl font-bold">Find a home</h1>
        <p className="max-w-3xl text-slate-700">
          Results are a list of published properties. Evidence status is shown
          per fact. Missing evidence stays UNKNOWN. MapAble does not rank homes
          or decide what is suitable for you.
        </p>
      </header>

      <form
        method="get"
        className="grid gap-4 rounded-lg border p-4 sm:grid-cols-4"
      >
        <label className="block text-sm">
          <span className="font-medium">Suburb</span>
          <input
            name="suburb"
            defaultValue={suburb ?? ""}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Property type</span>
          <input
            name="propertyType"
            defaultValue={propertyType ?? ""}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Min bedrooms</span>
          <input
            name="bedrooms"
            type="number"
            min={0}
            defaultValue={bedroomCount ?? ""}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded bg-slate-900 px-4 py-2 text-white"
          >
            Search
          </button>
        </div>
      </form>

      {disabled ? (
        <p className="rounded border border-slate-300 bg-slate-50 p-4">
          Home discovery is not enabled in this environment.
        </p>
      ) : null}
      {errorMessage ? (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-4">
          {errorMessage}
        </p>
      ) : null}

      {!disabled && !errorMessage ? (
        <section aria-labelledby="results-heading" className="space-y-4">
          <h2 id="results-heading" className="text-xl font-semibold">
            Results ({properties.length})
          </h2>
          {properties.length === 0 ? (
            <p>No published homes match these filters.</p>
          ) : (
            <ul className="space-y-4">
              {properties.map((property) => (
                <li
                  key={property.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <h3 className="text-lg font-semibold">
                    <Link
                      href={`/home/properties/${property.id}`}
                      className="underline"
                    >
                      {property.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-slate-700">
                    {[property.suburb, property.state]
                      .filter(Boolean)
                      .join(", ") || "Location precision limited"}
                  </p>
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="font-medium">Type</dt>
                      <dd>{property.propertyType}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Availability</dt>
                      <dd>{property.availabilityStatus}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Open vacancies</dt>
                      <dd>{property.openVacancyCount}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Evidence features</dt>
                      <dd>{property.evidenceFeatureCount}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Support independent</dt>
                      <dd>
                        {property.supportProviderIndependent
                          ? "Yes"
                          : "Related support noted"}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs text-slate-600">
                    {property.claimSafetyNote}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </main>
  );
}
