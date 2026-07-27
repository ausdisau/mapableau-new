import type { Metadata } from "next";
import Link from "next/link";

import { DonateForm } from "@/components/donations/DonateForm";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { MAPABLE_DONATION_URL } from "@/lib/brand/constants";
import { canonicalAlternate } from "@/lib/config/canonical-url";
import {
  AUSTRALIAN_DISABILITY_LTD_ABN,
  AUSTRALIAN_DISABILITY_LTD_LEGAL_NAME,
} from "@/lib/config/json-ld";
import { isDonationStripeEnabled } from "@/lib/donations/config";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Support Australian Disability Ltd and MapAble with a one-time card donation via Stripe, or give via PayPal.",
  alternates: canonicalAlternate("/donate"),
};

type PageProps = {
  searchParams: Promise<{ checkout?: string }>;
};

export default async function DonatePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cancelled = params.checkout === "cancelled";
  const stripeEnabled = isDonationStripeEnabled();

  return (
    <MapAbleCareMarketingShell>
      <main className="mx-auto max-w-3xl space-y-8 px-5 py-10 lg:px-8">
        <header className="space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#005B7F]">
            Support MapAble
          </p>
          <h1 className="font-heading text-4xl font-black tracking-[-0.04em] text-[#0C1833]">
            Donate to {AUSTRALIAN_DISABILITY_LTD_LEGAL_NAME}
          </h1>
          <p className="max-w-2xl text-base text-slate-600">
            Your gift helps us build accessible places discovery, NDIS provider
            tools, and inclusive community infrastructure across Australia.
            One-time card payments are processed securely by Stripe — card details
            never touch MapAble servers.
          </p>
          <p className="text-sm text-slate-600">
            ABN {AUSTRALIAN_DISABILITY_LTD_ABN}. Receipts and any tax treatment
            follow the payment processor and applicable Australian rules; this
            page does not issue a tax deduction certificate.
          </p>
        </header>

        <section
          aria-labelledby="donate-form-heading"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2
            id="donate-form-heading"
            className="font-heading text-xl font-bold text-[#0C1833]"
          >
            Make a one-time donation
          </h2>
          <div className="mt-5">
            <DonateForm
              stripeEnabled={stripeEnabled}
              paypalUrl={MAPABLE_DONATION_URL}
              cancelled={cancelled}
            />
          </div>
        </section>

        <p className="text-sm text-slate-600">
          Questions?{" "}
          <Link
            href="/contact"
            className={`font-bold text-[#005B7F] underline-offset-4 hover:underline ${mapableCareFocusRing}`}
          >
            Contact MapAble
          </Link>
          .
        </p>
      </main>
    </MapAbleCareMarketingShell>
  );
}
