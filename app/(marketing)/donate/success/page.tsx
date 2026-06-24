import Link from "next/link";

import {
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";

export const metadata = {
  title: "Thank you | MapAble",
  description: "Thank you for supporting MapAble.",
};

type DonateSuccessPageProps = {
  searchParams?: Promise<{ session_id?: string }>;
};

export default async function DonateSuccessPage({ searchParams }: DonateSuccessPageProps) {
  const params = (await searchParams) ?? {};
  const sessionId = params.session_id;

  return (
    <div className="bg-white text-mapable-navy">
      <section className="border-b border-slate-200 bg-mapable-surface">
        <div className={`${mapablePublicPageContainerClass} py-14 sm:py-20`}>
          <div className="max-w-3xl">
            <p className={mapablePublicEyebrowClass}>Thank you</p>
            <h1 className={`${mapablePublicTitleClass} mt-3`}>Your donation means a lot</h1>
            <p className={mapablePublicLeadClass}>
              We received your payment. Stripe may send a receipt to the email address
              you used at checkout.
            </p>
            {sessionId && (
              <p className="mt-4 text-sm text-slate-600">
                Reference: <span className="font-mono text-xs">{sessionId}</span>
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/" className={mapablePublicPrimaryButtonClass}>
                Back to home
              </Link>
              <Link
                href="/donate"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border-2 border-mapable-navy px-6 text-sm font-black text-mapable-navy transition hover:bg-slate-50"
              >
                Donate again
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
