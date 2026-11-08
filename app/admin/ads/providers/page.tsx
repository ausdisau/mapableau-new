import Link from "next/link";

import { adsFlagsConfig } from "@/lib/ads/config/flags";
import {
  listCatalogProviders,
  syncSeedRegistryIntoCatalog,
} from "@/lib/ads/discovery/provider-discovery";
import { requireAdmin } from "@/lib/auth/guards";

const ASSURANCE_ORDER = [
  "catalogued",
  "source_reviewed",
  "vendor_confirmed",
  "commercially_approved",
  "sandbox_verified",
  "security_privacy_accessibility_signed_off",
  "limited_live",
  "production_enabled",
  "suspended",
] as const;

export default async function AdsProvidersAdminPage() {
  await requireAdmin();
  const discoveryOn = adsFlagsConfig.isProviderDiscoveryEnabled();

  if (discoveryOn) {
    await syncSeedRegistryIntoCatalog();
  }
  const providers = discoveryOn ? await listCatalogProviders() : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-2">
        <p className="text-sm">
          <Link href="/admin/ads" className="underline">
            Ads admin
          </Link>
          {" / "}
          Providers
        </p>
        <h1 className="text-2xl font-bold">Provider discovery registry</h1>
        <p className="text-sm text-muted-foreground">
          Catalogue rows are research evidence only. Distinct assurance states
          must be advanced by humans — catalogue presence never enables live
          spend.
        </p>
      </header>

      {!discoveryOn ? (
        <p role="status" className="text-sm">
          MAPABLE_ADS_PROVIDER_DISCOVERY_ENABLED is false.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <caption className="sr-only">
              Provider catalogue assurance states
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-2 pr-3">
                  Provider
                </th>
                <th scope="col" className="py-2 pr-3">
                  Assurance
                </th>
                <th scope="col" className="py-2 pr-3">
                  Retrieved
                </th>
                <th scope="col" className="py-2">
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              {providers.map((row) => (
                <tr key={row.id} className="border-b border-border align-top">
                  <td className="py-2 pr-3">{row.catalogProviderId}</td>
                  <td className="py-2 pr-3">
                    <ol className="list-decimal pl-4">
                      {ASSURANCE_ORDER.map((state) => (
                        <li
                          key={state}
                          className={
                            row.assuranceState === state
                              ? "font-semibold"
                              : "text-muted-foreground"
                          }
                        >
                          {state}
                          {row.assuranceState === state ? " (current)" : ""}
                        </li>
                      ))}
                    </ol>
                  </td>
                  <td className="py-2 pr-3">
                    {row.retrievedAt.toISOString()}
                  </td>
                  <td className="py-2 break-all">
                    <a className="underline" href={row.sourceUrl}>
                      {row.sourceUrl}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
