import { DonateClient } from "@/components/donations/DonateClient";
import {
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicMutedCardClass,
  mapablePublicPageContainerClass,
  mapablePublicSectionTitleClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";

export const metadata = {
  title: "Donate | MapAble",
  description:
    "Support MapAble with a secure one-time donation. Funds help connect people with disability to care, transport, and employment services.",
};

type DonatePageProps = {
  searchParams?: Promise<{ cancelled?: string }>;
};

export default async function DonatePage({ searchParams }: DonatePageProps) {
  const params = (await searchParams) ?? {};
  const cancelled = params.cancelled === "1";

  return (
    <div className="bg-white text-mapable-navy">
      <section className="relative overflow-hidden border-b border-slate-200 bg-mapable-surface">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-64 w-64 rounded-full bg-mapable-gold/25 blur-3xl"
        />
        <div className={`${mapablePublicPageContainerClass} relative py-14 sm:py-20`}>
          <div className="max-w-3xl">
            <p className={mapablePublicEyebrowClass}>Donate</p>
            <h1 className={`${mapablePublicTitleClass} mt-3`}>Support MapAble</h1>
            <p className={mapablePublicLeadClass}>
              Make a one-time gift to help MapAble build accessible technology for
              care, transport, and employment in the disability community.
            </p>
          </div>
        </div>
      </section>

      <section className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-start">
          <DonateClient cancelled={cancelled} />

          <aside className="space-y-5">
            <article className={`${mapablePublicMutedCardClass} border-[#005B7F]/15`}>
              <p className={mapablePublicSectionTitleClass}>Secure checkout</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                <li>You do not need a MapAble account to donate.</li>
                <li>Payments are processed by Stripe on our platform account.</li>
                <li>Stripe can email you a receipt if you provide an email address.</li>
              </ul>
            </article>

            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-mapable-navy">Tax receipts</h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                MapAble donations are not tax-deductible in this release. If you need a
                DGR-compliant receipt, contact us and we can point you to partner
                organisations.
              </p>
            </article>
          </aside>
        </div>
      </section>
    </div>
  );
}
