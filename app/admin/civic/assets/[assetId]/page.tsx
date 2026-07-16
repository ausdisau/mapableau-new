import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { isCivicFlagEnabled } from "@/lib/civic-access/feature-flags";
import {
  getCivicAsset,
  serializeCivicAsset,
} from "@/lib/civic-access/assets/asset-registry-service";
import { projectStaticAccessibility } from "@/lib/civic-access/assets/static-projection-service";

export default async function CivicAssetDetailPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  await requireAdmin();
  const { assetId } = await params;

  if (!isCivicFlagEnabled("assetRegistry")) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Civic asset</h1>
        <p className="text-sm text-muted-foreground">
          Civic asset registry is disabled.
        </p>
      </div>
    );
  }

  let asset;
  let projection;
  try {
    asset = serializeCivicAsset(await getCivicAsset(assetId));
    projection = await projectStaticAccessibility(assetId);
  } catch {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Asset not found</h1>
        <Link className="text-sm underline" href="/admin/civic/assets">
          Back to assets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">{asset.title}</h1>
        <p className="text-sm text-muted-foreground">
          {asset.plainLanguageTitle ?? asset.stableKey}
        </p>
      </header>

      <section aria-labelledby="asset-meta-heading" className="rounded border p-4">
        <h2 id="asset-meta-heading" className="font-heading text-lg font-semibold">
          Asset metadata
        </h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Class / type</dt>
            <dd>
              {asset.assetClass} / {asset.assetType}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">AccessPlace ID</dt>
            <dd className="font-mono text-xs">{asset.accessPlaceId ?? "unbound"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Jurisdiction</dt>
            <dd>{asset.jurisdictionCode ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Last verified</dt>
            <dd>{asset.lastVerifiedAt ?? "unknown"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Visibility</dt>
            <dd>{asset.visibility}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Attribution</dt>
            <dd>{asset.attribution ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section
        aria-labelledby="projection-heading"
        className="rounded border p-4"
      >
        <h2 id="projection-heading" className="font-heading text-lg font-semibold">
          Static accessibility projection
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Geometry proves accessibility:{" "}
          {projection.geometryProvesAccessibility ? "yes" : "no"}. Unknown:{" "}
          {projection.unknownClaimCount}. Stale: {projection.staleClaimCount}.
          Disputed: {projection.disputedClaimCount}. Evidenced:{" "}
          {projection.evidencedClaimCount}.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {projection.claims.map((claim) => (
            <li key={claim.claimKey}>
              <strong>{claim.label}</strong> — {claim.state}
              {claim.sourceDate ? ` (source ${claim.sourceDate})` : ""}
            </li>
          ))}
        </ul>
        <h3 className="mt-4 text-sm font-semibold">Limitations</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {projection.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <p className="text-sm">
        <Link className="underline" href="/admin/civic/assets">
          Back to assets
        </Link>
      </p>
    </div>
  );
}
