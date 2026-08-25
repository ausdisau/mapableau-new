import Link from "next/link";
import { notFound } from "next/navigation";

import { canonicalAlternate } from "@/lib/config/canonical-url";
import { homeLivingConfig } from "@/lib/config/abilitypay-home-living";
import {
  getPublishedPropertyDetail,
  HomeDiscoveryDisabledError,
} from "@/lib/home-living/discovery/property-discovery-service";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  return {
    title: "Property detail | MapAble Home",
    alternates: canonicalAlternate(`/home/properties/${id}`),
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Params;
}) {
  if (!homeLivingConfig.enabled || !homeLivingConfig.discoveryEnabled) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <p>Home discovery is not enabled in this environment.</p>
      </main>
    );
  }

  const { id } = await params;
  let property;
  try {
    property = await getPublishedPropertyDetail(id);
  } catch (error) {
    if (error instanceof HomeDiscoveryDisabledError) {
      return (
        <main className="mx-auto max-w-4xl px-4 py-10">
          <p>Home discovery is not enabled in this environment.</p>
        </main>
      );
    }
    throw error;
  }
  if (!property) notFound();

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <p className="text-sm">
        <Link href="/home/find" className="underline">
          Back to search
        </Link>
      </p>
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">{property.title}</h1>
        <p className="text-slate-700">{property.addressDisplay}</p>
        <p className="text-sm text-slate-600">{property.claimSafetyNote}</p>
      </header>

      <section aria-labelledby="overview-heading" className="space-y-2">
        <h2 id="overview-heading" className="text-xl font-semibold">
          Overview
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="font-medium">Property type</dt>
            <dd>{property.propertyType}</dd>
          </div>
          <div>
            <dt className="font-medium">Bedrooms / bathrooms</dt>
            <dd>
              {property.bedroomCount ?? "Unknown"} /{" "}
              {property.bathroomCount ?? "Unknown"}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Availability</dt>
            <dd>{property.availabilityStatus}</dd>
          </div>
          <div>
            <dt className="font-medium">Rent display</dt>
            <dd>{property.rentDisplay ?? "Not stated"}</dd>
          </div>
          <div>
            <dt className="font-medium">SDA category (metadata only)</dt>
            <dd>{property.sdaCategory ?? "Not stated"}</dd>
          </div>
          <div>
            <dt className="font-medium">Support provider independent</dt>
            <dd>
              {property.supportProviderIndependent
                ? "Yes — housing and support are separate"
                : "A related support organisation is noted (not required)"}
            </dd>
          </div>
        </dl>
        {property.relatedSupportOrganisationNote ? (
          <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm">
            Support services are offered by an organisation related to this
            housing provider: {property.relatedSupportOrganisationNote}. Your
            choice of support remains separate.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="vacancies-heading" className="space-y-2">
        <h2 id="vacancies-heading" className="text-xl font-semibold">
          Availability / vacancies
        </h2>
        {property.vacancies.length === 0 ? (
          <p>
            No separate vacancy records. Property availability:{" "}
            {property.availabilityStatus}.
          </p>
        ) : (
          <ul className="list-disc space-y-1 pl-5">
            {property.vacancies.map((v) => (
              <li key={v.id}>
                {v.label ?? "Vacancy"} — {v.status}
                {v.availableFrom
                  ? ` from ${new Date(v.availableFrom).toLocaleDateString()}`
                  : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="evidence-heading" className="space-y-2">
        <h2 id="evidence-heading" className="text-xl font-semibold">
          Accessibility evidence
        </h2>
        <p className="text-sm text-slate-700">
          Each fact keeps its own status. There is no single Accessible or
          Verified badge for the whole property.
        </p>
        {property.evidence.length === 0 ? (
          <p>No accessibility evidence has been recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <caption className="sr-only">
                Accessibility evidence with status
              </caption>
              <thead>
                <tr className="border-b text-left">
                  <th scope="col" className="py-2 pr-4">
                    Feature
                  </th>
                  <th scope="col" className="py-2 pr-4">
                    Value
                  </th>
                  <th scope="col" className="py-2 pr-4">
                    Source
                  </th>
                  <th scope="col" className="py-2">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {property.evidence.map((item, index) => (
                  <tr key={`${item.feature}-${index}`} className="border-b">
                    <td className="py-2 pr-4">{item.feature}</td>
                    <td className="py-2 pr-4">{item.value}</td>
                    <td className="py-2 pr-4">{item.source}</td>
                    <td className="py-2">{item.displayStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="unknowns-heading" className="space-y-2">
        <h2 id="unknowns-heading" className="text-xl font-semibold">
          What is unknown
        </h2>
        {property.unknowns.length === 0 ? (
          <p>No highlighted gaps in the starter evidence checklist.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5">
            {property.unknowns.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="media-heading" className="space-y-2">
        <h2 id="media-heading" className="text-xl font-semibold">
          Media / tour
        </h2>
        {property.virtualTourUrl ? (
          <p>
            External virtual tour:{" "}
            <a
              href={property.virtualTourUrl}
              className="underline"
              rel="noopener noreferrer"
            >
              Open tour
            </a>
            . Structured access facts appear in the evidence and unknowns
            sections.
          </p>
        ) : (
          <p>No virtual tour URL supplied.</p>
        )}
        {property.media.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5">
            {property.media.map((m) => (
              <li key={m.id}>
                {m.kind}: {m.altText ?? m.caption ?? m.url}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section aria-labelledby="tech-heading" className="space-y-2">
        <h2 id="tech-heading" className="text-xl font-semibold">
          Home technology (descriptive only)
        </h2>
        <p className="text-sm text-slate-700">
          Capability notes are not device control. Compatibility is never
          inferred.
        </p>
        {property.capabilities.length === 0 ? (
          <p>No capability profile recorded.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5">
            {property.capabilities.map((c) => (
              <li key={c.key}>
                {c.key}: {String(c.value)} ({c.verificationStatus}, source{" "}
                {c.source})
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-wrap gap-3">
        <Link
          href={`/home/compare?ids=${property.id}`}
          className="rounded border px-4 py-2 underline"
        >
          Compare with other homes
        </Link>
        <Link
          href="/participant/home-and-living/shortlist"
          className="rounded border px-4 py-2 underline"
        >
          Manage shortlist (sign in)
        </Link>
      </section>
    </main>
  );
}
