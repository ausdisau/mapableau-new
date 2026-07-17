import { ClaimValidationPanel } from "@/components/ndis-pricing/ClaimValidationPanel";
import { QuoteLinePreview } from "@/components/ndis-pricing/QuoteLinePreview";
import { SupportItemLookup } from "@/components/ndis-pricing/SupportItemLookup";
import { SupportItemSelector } from "@/components/ndis-pricing/SupportItemSelector";
import { Badge } from "@/components/ui/badge";
import { requirePermission } from "@/lib/auth/guards";
import { mapableEyebrowBadgeClass, mapablePageContainerClass } from "@/lib/brand/styles";

export const metadata = {
  title: "NDIS pricing toolkit | MapAble Provider",
};

export default async function ProviderNdisPricingPage() {
  await requirePermission("provider:ndia:claim");

  return (
    <div className={mapablePageContainerClass}>
      <div className="mx-auto max-w-4xl py-8">
        <Badge variant="outline" className={mapableEyebrowBadgeClass}>
          Provider toolkit
        </Badge>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">
          NDIS <span className="text-primary">pricing intelligence</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Look up support items, build quotes, and pre-check invoices against your
          catalogue. Pre-checks do not submit claims or approve NDIA funding.
        </p>
        <div className="mt-10 space-y-8">
          <SupportItemSelector />
          <SupportItemLookup />
          <QuoteLinePreview audience="provider" />
          <ClaimValidationPanel view="provider" />
        </div>
      </div>
    </div>
  );
}
