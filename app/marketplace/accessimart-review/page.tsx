import type { Metadata } from "next";

import { AccessiMartReviewCatalogue } from "@/components/marketplace/accessimart-review/AccessiMartReviewCatalogue";
import { ACCESSIMART_PROVENANCE } from "@/lib/marketplace/accessimart-provenance";
import { ACCESSIMART_SYNTHETIC_CATALOGUE } from "@/lib/marketplace/accessimart-synthetic-catalogue";

export const metadata: Metadata = {
  title: "AccessiMart review catalogue | MapAble",
  description:
    "Authenticated, flag-gated, read-only AccessiMart synthetic catalogue for MapAble testers. No checkout, quotes or payments.",
  robots: { index: false, follow: false },
};

export default function AccessiMartReviewPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black tracking-tight">
          AccessiMart by MapAble — review catalogue
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
          Read-only synthetic listings for authorised testers. Supplier identity,
          product safety, warranty and NDIS eligibility are not independently
          verified. Commerce is disabled.
        </p>
        <p className="mt-2 text-xs text-slate-600">
          Source pin {ACCESSIMART_PROVENANCE.gitCommitSha.slice(0, 12)} · licence{" "}
          {ACCESSIMART_PROVENANCE.declaredLicence} (no LICENSE file in export) ·
          flag MAPABLE_ACCESSIMART_REVIEW_ENABLED
        </p>
      </header>
      <AccessiMartReviewCatalogue listings={ACCESSIMART_SYNTHETIC_CATALOGUE} />
    </div>
  );
}
