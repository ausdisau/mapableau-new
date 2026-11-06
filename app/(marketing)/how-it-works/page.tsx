import type { Metadata } from "next";
import Link from "next/link";

import { howItWorksSteps } from "@/lib/marketing/mapable-care-combined-data";
import { canonicalAlternate } from "@/lib/config/canonical-url";
import {
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";

export const metadata: Metadata = {
  title: "How it works | MapAble",
  description:
    "How MapAble connects places, transport, and support planning in one consent-controlled journey — without automatic assignment or pay-to-rank.",
  alternates: canonicalAlternate("/how-it-works"),
};

export default function HowItWorksPage() {
  return (
    <div className="bg-white text-[#0C1833]">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[#F6FBFC]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-64 w-64 rounded-full bg-[#F8C51C]/25 blur-3xl"
        />
        <div
          className={`${mapablePublicPageContainerClass} relative py-14 sm:py-20`}
        >
          <div className="max-w-3xl">
            <p className={mapablePublicEyebrowClass}>How it works</p>
            <h1 className={`${mapablePublicTitleClass} mt-3`}>
              One journey. Your consent. Human gates.
            </h1>
            <p className={mapablePublicLeadClass}>
              Connect places, transport, and support planning in one journey —
              with consent you control. MapAble does not auto-assign workers or
              sell pay-to-rank listings.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/#pre-register"
                className={mapablePublicPrimaryButtonClass}
              >
                Pre-register interest
              </Link>
              <Link
                href="/for-providers"
                className={mapablePublicSecondaryButtonClass}
              >
                Provider interest
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="journey-steps-heading"
        className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}
      >
        <h2
          id="journey-steps-heading"
          className="mapable-display text-2xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-3xl"
        >
          The journey, step by step
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          This list is the primary view. Visual steppers elsewhere always keep a
          matching list alternative for keyboard and screen-reader users.
        </p>
        <ol className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
          {howItWorksSteps.map((step) => (
            <li
              key={step.number}
              className="grid gap-3 py-6 md:grid-cols-[7rem_minmax(0,1fr)] md:gap-8"
            >
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#005B7F]">
                Step {step.number}
              </p>
              <div>
                <h3 className="text-xl font-black text-[#0C1833]">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/contact" className={mapablePublicPrimaryButtonClass}>
            Contact MapAble
          </Link>
          <Link
            href="/accessibility-statement"
            className={mapablePublicSecondaryButtonClass}
          >
            Accessibility statement
          </Link>
        </div>
      </section>
    </div>
  );
}
