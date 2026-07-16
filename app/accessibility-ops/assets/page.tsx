import Link from "next/link";

import {
  isAccessibilityOpsFlagEnabled,
} from "@/lib/accessibility-ops/feature-flags";
import { listAccessibilityAssets } from "@/lib/accessibility-ops/assets/asset-registry-service";
import { serializeAsset } from "@/lib/accessibility-ops/assets/asset-registry-service";

export default async function AccessibilityOpsAssetsPage() {
  if (
    !isAccessibilityOpsFlagEnabled("opsEnabled") ||
    !isAccessibilityOpsFlagEnabled("assetRegistry")
  ) {
    return (
      <p className="text-sm text-muted-foreground">
        Asset registry is disabled. Enable{" "}
        <code>MAPABLE_ACCESSIBILITY_OPS_ENABLED</code> and{" "}
        <code>MAPABLE_ACCESSIBILITY_ASSET_REGISTRY_ENABLED</code>.
      </p>
    );
  }

  const assets = (await listAccessibilityAssets()).map(serializeAsset);

  return (
    <section aria-labelledby="assets-heading" className="space-y-4">
      <h2 id="assets-heading" className="text-xl font-semibold">
        Accessibility assets
      </h2>
      <p className="text-sm text-muted-foreground">
        {assets.length} registered asset{assets.length === 1 ? "" : "s"}. Criticality
        is purpose-derived, not a participant score.
      </p>
      {assets.length === 0 ? (
        <p className="text-sm">
          No assets yet. Seed the{" "}
          <Link className="underline" href="/accessibility-ops/pilot">
            pilot
          </Link>{" "}
          or POST to <code>/api/accessibility-ops/assets</code>.
        </p>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Registered accessibility assets</caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-2 pr-3">
                Title
              </th>
              <th scope="col" className="py-2 pr-3">
                Type
              </th>
              <th scope="col" className="py-2 pr-3">
                Criticality
              </th>
              <th scope="col" className="py-2">
                Canonical ref
              </th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-b border-border/60">
                <td className="py-2 pr-3">
                  <Link
                    className="underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    href={`/accessibility-ops/assets/${asset.id}`}
                  >
                    {asset.title}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {asset.stableKey}
                  </div>
                </td>
                <td className="py-2 pr-3">
                  {asset.assetClass} / {asset.assetType}
                </td>
                <td className="py-2 pr-3">
                  <span className="sr-only">Criticality: </span>
                  {asset.criticality.replace("_", " ")}
                </td>
                <td className="py-2 font-mono text-xs">
                  {asset.canonicalDomainRef ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
