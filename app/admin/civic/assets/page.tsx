import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { isCivicFlagEnabled } from "@/lib/civic-access/feature-flags";
import {
  listCivicAssets,
  serializeCivicAsset,
} from "@/lib/civic-access/assets/asset-registry-service";

export default async function CivicAssetsAdminPage() {
  await requireAdmin();

  if (!isCivicFlagEnabled("assetRegistry")) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Civic assets</h1>
        <p className="text-sm text-muted-foreground">
          MapAble Civic asset registry is disabled. Set{" "}
          <code>MAPABLE_CIVIC_ENABLED=true</code> and{" "}
          <code>MAPABLE_CIVIC_ASSET_REGISTRY_ENABLED=true</code> to enable.
        </p>
        <Link className="text-sm underline" href="/admin/civic">
          Back to Civic admin
        </Link>
      </div>
    );
  }

  const assets = (await listCivicAssets()).map(serializeCivicAsset);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">Civic asset registry</h1>
        <p className="text-sm text-muted-foreground">
          Internal read-only view. Assets reference AccessPlace — they do not
          duplicate place records. Missing claims remain unknown.
        </p>
      </header>

      {assets.length === 0 ? (
        <p className="text-sm">
          No assets registered. Seed the{" "}
          <Link className="underline" href="/admin/civic/pilot">
            Harbour precinct pilot
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              Registered Civic accessibility assets
            </caption>
            <thead>
              <tr className="border-b">
                <th scope="col" className="p-2 font-semibold">
                  Title
                </th>
                <th scope="col" className="p-2 font-semibold">
                  Class
                </th>
                <th scope="col" className="p-2 font-semibold">
                  Type
                </th>
                <th scope="col" className="p-2 font-semibold">
                  AccessPlace
                </th>
                <th scope="col" className="p-2 font-semibold">
                  Visibility
                </th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id} className="border-b">
                  <td className="p-2">
                    <Link
                      className="underline"
                      href={`/admin/civic/assets/${asset.id}`}
                    >
                      {asset.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {asset.stableKey}
                    </div>
                  </td>
                  <td className="p-2">{asset.assetClass}</td>
                  <td className="p-2">{asset.assetType}</td>
                  <td className="p-2 font-mono text-xs">
                    {asset.accessPlaceId ?? "—"}
                  </td>
                  <td className="p-2">{asset.visibility}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-sm">
        <Link className="underline" href="/admin/civic">
          Back to Civic admin
        </Link>
      </p>
    </div>
  );
}
