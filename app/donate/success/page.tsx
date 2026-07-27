import type { Metadata } from "next";
import Link from "next/link";

import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { canonicalAlternate } from "@/lib/config/canonical-url";
import { AUSTRALIAN_DISABILITY_LTD_LEGAL_NAME } from "@/lib/config/json-ld";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export const metadata: Metadata = {
  title: "Thank you for your donation",
  description: `Thank you for supporting ${AUSTRALIAN_DISABILITY_LTD_LEGAL_NAME} and MapAble.`,
  alternates: canonicalAlternate("/donate/success"),
  robots: { index: false, follow: true },
};

type PageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function DonateSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sessionId = params.session_id?.trim();

  return (
    <MapAbleCareMarketingShell>
      <main className="mx-auto max-w-2xl space-y-6 px-5 py-12 lg:px-8">
        <header className="space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#005B7F]">
            Donation received
          </p>
          <h1 className="font-heading text-4xl font-black tracking-[-0.04em] text-[#0C1833]">
            Thank you for supporting {AUSTRALIAN_DISABILITY_LTD_LEGAL_NAME}
          </h1>
          <p className="text-base text-slate-600">
            Your one-time gift helps MapAble grow accessible places discovery and
            inclusive community tools. Stripe will email a payment confirmation to
            the address you used at checkout.
          </p>
          <p className="text-sm text-slate-600">
            This page is not a tax deduction certificate. Keep your Stripe receipt
            for your records.
          </p>
          {sessionId ? (
            <p className="text-xs text-slate-500">
              Reference: <span className="font-mono">{sessionId}</span>
            </p>
          ) : null}
        </header>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-5 text-sm font-black text-white ${mapableCareFocusRing}`}
          >
            Back to MapAble
          </Link>
          <Link
            href="/donate"
            className={`inline-flex min-h-11 items-center rounded-xl border-2 border-[#0C1833] px-5 text-sm font-black text-[#0C1833] ${mapableCareFocusRing}`}
          >
            Donate again
          </Link>
        </div>
      </main>
    </MapAbleCareMarketingShell>
  );
}
