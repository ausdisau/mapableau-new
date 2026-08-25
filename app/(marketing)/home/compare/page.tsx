import Link from "next/link";

import { canonicalAlternate } from "@/lib/config/canonical-url";
import { homeLivingConfig } from "@/lib/config/abilitypay-home-living";
import {
  comparePublishedProperties,
  HomeCompareDisabledError,
} from "@/lib/home-living/discovery/compare-service";

export const metadata = {
  title: "Compare homes | MapAble Home",
  description:
    "Compare up to four homes side by side. MapAble does not score suitability.",
  alternates: canonicalAlternate("/home/compare"),
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CompareHomesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const idsParam = typeof params.ids === "string" ? params.ids : "";
  const propertyIds = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 4);
  const requirementsParam =
    typeof params.requirements === "string" ? params.requirements : "";
  const selectedRequirements = requirementsParam
    .split("|")
    .map((r) => r.trim())
    .filter(Boolean);

  let comparison: Awaited<ReturnType<typeof comparePublishedProperties>> | null =
    null;
  let disabled = !(
    homeLivingConfig.enabled &&
    homeLivingConfig.discoveryEnabled &&
    homeLivingConfig.compareEnabled
  );
  let errorMessage: string | null = null;

  if (!disabled && propertyIds.length >= 2) {
    try {
      comparison = await comparePublishedProperties({
        propertyIds,
        selectedRequirements,
      });
    } catch (error) {
      if (error instanceof HomeCompareDisabledError) disabled = true;
      else errorMessage = "Unable to compare homes right now.";
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <p className="text-sm">
          <Link href="/home" className="underline">
            MapAble Home
          </Link>
        </p>
        <h1 className="font-heading text-3xl font-bold">Compare homes</h1>
        <p className="max-w-3xl text-slate-700">
          These homes meet the requirements you selected in different ways.
          MapAble does not calculate a suitability percentage or choose a home
          for you.
        </p>
      </header>

      <form method="get" className="space-y-3 rounded border p-4">
        <label className="block text-sm">
          <span className="font-medium">
            Property IDs (comma-separated, max 4)
          </span>
          <input
            name="ids"
            defaultValue={propertyIds.join(",")}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">
            Requirements to check (separate with |)
          </span>
          <input
            name="requirements"
            defaultValue={selectedRequirements.join("|")}
            placeholder="step free entrance|roll in shower"
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-slate-900 px-4 py-2 text-white"
        >
          Compare
        </button>
      </form>

      {disabled ? (
        <p className="rounded border bg-slate-50 p-4">
          Home compare is not enabled in this environment.
        </p>
      ) : null}
      {errorMessage ? (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-4">
          {errorMessage}
        </p>
      ) : null}
      {!disabled && propertyIds.length < 2 ? (
        <p>Select at least two property IDs to compare.</p>
      ) : null}

      {comparison ? (
        <section aria-labelledby="compare-heading" className="space-y-4">
          <h2 id="compare-heading" className="text-xl font-semibold">
            Comparison
          </h2>
          <p className="text-sm text-slate-700">{comparison.guidance}</p>
          <ul className="flex flex-wrap gap-3 text-sm">
            {comparison.properties.map((p) => (
              <li key={p.id}>
                <Link href={`/home/properties/${p.id}`} className="underline">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <caption className="sr-only">
                Side-by-side home comparison
              </caption>
              <thead>
                <tr className="border-b text-left">
                  <th scope="col" className="py-2 pr-3">
                    Feature
                  </th>
                  {comparison.properties.map((p) => (
                    <th key={p.id} scope="col" className="py-2 pr-3">
                      {p.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.rows.map((row) => (
                  <tr key={row.featureLabel} className="border-b align-top">
                    <th scope="row" className="py-2 pr-3 font-medium">
                      {row.featureLabel}
                    </th>
                    {row.values.map((value) => (
                      <td key={value.propertyId} className="py-2 pr-3">
                        <span>{value.display}</span>
                        <span className="mt-1 block text-xs text-slate-600">
                          {value.matchState}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  );
}
