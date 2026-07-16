import Link from "next/link";
import { notFound } from "next/navigation";

import { isAccessibilityOpsFlagEnabled } from "@/lib/accessibility-ops/feature-flags";
import {
  getAccessibilityAsset,
  serializeAsset,
} from "@/lib/accessibility-ops/assets/asset-registry-service";

type Props = { params: Promise<{ assetId: string }> };

export default async function AccessibilityOpsAssetDetailPage({ params }: Props) {
  if (
    !isAccessibilityOpsFlagEnabled("opsEnabled") ||
    !isAccessibilityOpsFlagEnabled("assetRegistry")
  ) {
    return (
      <p className="text-sm text-muted-foreground">Asset registry is disabled.</p>
    );
  }

  const { assetId } = await params;
  const asset = await getAccessibilityAsset(assetId);
  if (!asset) notFound();
  const view = serializeAsset(asset);

  return (
    <article className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm">
          <Link className="underline" href="/accessibility-ops/assets">
            Back to assets
          </Link>
        </p>
        <h2 className="text-xl font-semibold">{view.title}</h2>
        <p className="text-sm text-muted-foreground">
          {view.plainLanguageTitle ?? view.description ?? "No plain-language summary."}
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Stable key</dt>
          <dd className="font-mono text-xs">{view.stableKey}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Criticality</dt>
          <dd>{view.criticality}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Class / type</dt>
          <dd>
            {view.assetClass} / {view.assetType}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Canonical domain ref</dt>
          <dd className="font-mono text-xs">{view.canonicalDomainRef ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Lifecycle</dt>
          <dd>{view.lifecycleState}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Owners</dt>
          <dd>
            {view.owners.length === 0
              ? "Unassigned"
              : view.owners.map((o) => o.userId).join(", ")}
          </dd>
        </div>
      </dl>

      <section aria-labelledby="versions-heading" className="space-y-2">
        <h3 id="versions-heading" className="text-lg font-semibold">
          Versions
        </h3>
        {view.versions.length === 0 ? (
          <p className="text-sm">No versions recorded.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {view.versions.map((v) => (
              <li key={v.id}>
                {v.versionLabel}
                {v.contentHash ? ` — hash ${v.contentHash.slice(0, 12)}…` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="deps-heading" className="space-y-2">
        <h3 id="deps-heading" className="text-lg font-semibold">
          Dependencies
        </h3>
        {view.dependencies.length === 0 ? (
          <p className="text-sm">No dependencies.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {view.dependencies.map((d) => (
              <li key={d.id}>
                <Link
                  className="underline"
                  href={`/accessibility-ops/assets/${d.dependsOnAssetId}`}
                >
                  {d.dependsOnAssetId}
                </Link>{" "}
                ({d.dependencyType})
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
