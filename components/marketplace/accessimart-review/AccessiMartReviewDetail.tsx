import Link from "next/link";

import type { AccessiMartReviewListing } from "@/lib/marketplace/accessimart-review-adapter";
import {
  mapablePublicCardClass,
  mapablePublicSecondaryButtonClass,
} from "@/lib/marketing/public-page-styles";

export function AccessiMartReviewDetail({
  listing,
}: {
  listing: AccessiMartReviewListing;
}) {
  return (
    <article className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap gap-2 text-slate-700">
          <li>
            <Link
              href="/marketplace/accessimart-review"
              className="underline underline-offset-4 focus:outline-none focus:ring-4 focus:ring-amber-300"
            >
              AccessiMart review catalogue
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold text-slate-900">
            {listing.name}
          </li>
        </ol>
      </nav>

      <header className={mapablePublicCardClass}>
        <h1 className="text-2xl font-black sm:text-3xl">{listing.name}</h1>
        <p className="mt-3 leading-7 text-slate-700">{listing.description}</p>
        <p className="mt-4 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
          Review-only synthetic listing. Source ID <strong>{listing.sourceId}</strong>.
          Evidence status: <strong>{listing.evidenceStatus}</strong>. Last verified
          date: <strong>{listing.lastVerifiedAt ?? "Unknown"}</strong> (unverified).
          Checkout, quotes and seller contact are unavailable.
        </p>
      </header>

      <section aria-labelledby="access-need-heading" className={mapablePublicCardClass}>
        <h2 id="access-need-heading" className="text-xl font-black">
          Access need and intended use
        </h2>
        <dl className="mt-3 space-y-2 text-sm leading-6">
          <div>
            <dt className="font-semibold">Access need (seller-stated)</dt>
            <dd>{listing.sourceClaims.accessNeed ?? "Not provided"}</dd>
          </div>
          <div>
            <dt className="font-semibold">Intended use (seller-stated)</dt>
            <dd>{listing.sourceClaims.intendedUse ?? "Not provided"}</dd>
          </div>
          <div>
            <dt className="font-semibold">Support category (seller-stated)</dt>
            <dd>{listing.sourceClaims.supportCategory ?? "Not provided"}</dd>
          </div>
          <div>
            <dt className="font-semibold">Setup complexity</dt>
            <dd>{listing.setupComplexity ?? "Not provided"}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="safety-heading" className={mapablePublicCardClass}>
        <h2 id="safety-heading" className="text-xl font-black">
          Safety and clinical notes
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          Product safety assurance: <strong>not independently verified</strong>.
        </p>
        {listing.clinicalReviewRecommended ? (
          <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Clinical or specialist review is recommended. MapAble does not provide
            clinical advice or product suitability assessments here.
          </p>
        ) : null}
        <dl className="mt-3 space-y-2 text-sm leading-6">
          <div>
            <dt className="font-semibold">Safety notes (seller-stated)</dt>
            <dd>{listing.safetyNotes ?? "No safety notes provided"}</dd>
          </div>
          <div>
            <dt className="font-semibold">TGA/ARTG status (seller-stated)</dt>
            <dd>
              {listing.sourceClaims.tgaArtgStatus ?? "Not provided"} — not
              independently verified
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="warranty-heading" className={mapablePublicCardClass}>
        <h2 id="warranty-heading" className="text-xl font-black">
          Warranty and repair
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          Warranty assurance: <strong>not independently verified</strong>.
        </p>
        <dl className="mt-3 space-y-2 text-sm leading-6">
          <div>
            <dt className="font-semibold">Warranty period (seller-stated)</dt>
            <dd>{listing.warrantyPeriod ?? "Not provided"}</dd>
          </div>
          <div>
            <dt className="font-semibold">Supplier warranty policy</dt>
            <dd>{listing.supplier?.warrantyPolicy ?? "Not provided"}</dd>
          </div>
          <div>
            <dt className="font-semibold">Supplier repair policy</dt>
            <dd>{listing.supplier?.repairPolicy ?? "Not provided"}</dd>
          </div>
          <div>
            <dt className="font-semibold">Repair / spare parts available</dt>
            <dd>
              Repair: {listing.repairAvailable ? "claimed" : "not claimed"}; spare
              parts: {listing.sparePartsAvailable ? "claimed" : "not claimed"}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="funding-heading" className={mapablePublicCardClass}>
        <h2 id="funding-heading" className="text-xl font-black">
          NDIS guidance (informational)
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          NDIS eligibility: <strong>not assessed</strong>. MapAble does not claim
          funding, prescribe equipment or submit claims.
        </p>
        <p className="mt-3 text-sm leading-6">
          {listing.sourceClaims.ndisGuidance ?? "No NDIS guidance text provided."}
        </p>
      </section>

      <section aria-labelledby="supplier-heading" className={mapablePublicCardClass}>
        <h2 id="supplier-heading" className="text-xl font-black">
          Supplier claims
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          Supplier identity: <strong>not independently verified</strong>. Contact
          details are withheld in this review slice.
        </p>
        {listing.supplier ? (
          <dl className="mt-3 space-y-2 text-sm leading-6">
            <div>
              <dt className="font-semibold">Source supplier ID</dt>
              <dd>{listing.supplier.sourceSupplierId}</dd>
            </div>
            <div>
              <dt className="font-semibold">Trading / legal name (fictionalised)</dt>
              <dd>
                {listing.supplier.tradingName ?? listing.supplier.legalName}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Service regions (seller-stated)</dt>
              <dd>{listing.supplier.serviceRegions ?? "Not provided"}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm">No supplier claim attached.</p>
        )}
      </section>

      <p>
        <Link href="/marketplace/accessimart-review" className={mapablePublicSecondaryButtonClass}>
          Back to catalogue
        </Link>
      </p>
    </article>
  );
}
