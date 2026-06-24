import { PriceCatalogueImportForm } from "@/components/ndis-pricing/PriceCatalogueImportForm";
import { SupportItemLookup } from "@/components/ndis-pricing/SupportItemLookup";
import { QuoteLinePreview } from "@/components/ndis-pricing/QuoteLinePreview";
import { ClaimValidationPanel } from "@/components/ndis-pricing/ClaimValidationPanel";
import { Badge } from "@/components/ui/badge";
import { mapableEyebrowBadgeClass, mapablePageContainerClass } from "@/lib/brand/styles";
import { listCatalogueVersions } from "@/lib/ndis-pricing/pricing-version-service";

export const metadata = {
  title: "NDIS price catalogue | MapAble Admin",
};

export default async function NdisPriceCatalogueAdminPage() {
  const versions = await listCatalogueVersions(10);

  return (
    <div className={mapablePageContainerClass}>
      <Badge variant="outline" className={mapableEyebrowBadgeClass}>
        NDIS pricing intelligence
      </Badge>
      <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">
        Price catalogue <span className="text-primary">management</span>
      </h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Import NDIS Price Guide data manually, preserve historical versions, and
        run quote and claim pre-checks. This layer does not scrape NDIS websites or
        auto-submit claims.
      </p>

      <section className="mt-8" aria-labelledby="versions-heading">
        <h2 id="versions-heading" className="font-heading text-xl font-semibold">
          Catalogue versions
        </h2>
        {versions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No versions applied yet. Import a CSV to create the first catalogue
            version.
          </p>
        ) : (
          <ul className="mt-3 divide-y rounded-md border">
            {versions.map((v) => (
              <li key={v.id} className="flex flex-wrap justify-between gap-2 p-3 text-sm">
                <div>
                  <span className="font-medium">{v.catalogue.name}</span>
                  <span className="ml-2 font-mono text-muted-foreground">
                    {v.version}
                  </span>
                  {v.catalogue.active ? (
                    <Badge variant="outline" className="ml-2">
                      Active
                    </Badge>
                  ) : null}
                </div>
                <span className="text-muted-foreground">
                  {v._count.prices} prices ·{" "}
                  {v.appliedAt
                    ? new Date(v.appliedAt).toLocaleDateString()
                    : "Not applied"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <PriceCatalogueImportForm />
        <SupportItemLookup />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <QuoteLinePreview audience="admin" />
        <ClaimValidationPanel view="admin" />
      </div>
    </div>
  );
}
