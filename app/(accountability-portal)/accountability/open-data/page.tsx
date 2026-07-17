import Link from "next/link";

import { DemonstrationBanner } from "@/components/accountability/DemonstrationBanner";
import { ExplainThisPage } from "@/components/accountability/ExplainThisPage";
import { listPublishedDatasets } from "@/lib/accountability/public-reader";

export default async function AccountabilityOpenDataPage() {
  const datasets = await listPublishedDatasets();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Open data catalogue</h1>
        <p className="max-w-2xl text-muted-foreground">
          Privacy-safe downloadable datasets with methodology, schema and
          checksums. Packaged from publication snapshots only.
        </p>
      </header>
      <ExplainThisPage summary="Each dataset lists publisher, period, licence, suppression rules and known limitations. Machine-readable access is available under /api/public/accountability/v1/datasets." />
      {datasets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No datasets published yet.</p>
      ) : (
        <ul className="space-y-4">
          {datasets.map((dataset) => (
            <li key={dataset.publicId} className="rounded-xl border border-slate-200 bg-white p-5">
              <DemonstrationBanner show={dataset.isDemonstration} />
              <h2 className="mt-2 font-heading text-lg font-semibold">
                <Link
                  href={`/accountability/datasets/${dataset.publicId}`}
                  className="text-primary hover:underline"
                >
                  {dataset.title}
                </Link>
              </h2>
              <p className="mt-1 text-sm">{dataset.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {dataset.licence}
                {dataset.versions[0]
                  ? ` · v${dataset.versions[0].version} · ${dataset.versions[0].recordCount} records`
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
