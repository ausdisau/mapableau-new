import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export const metadata: Metadata = {
  title: "Provider growth tools | MapAble",
  description:
    "Grow by being useful, trusted, and accessible with availability, access-readiness, and enquiry tools.",
};

const tools = [
  "Live availability updates",
  "Verified access-readiness profile",
  "Response-time badge",
  "Enquiry tracker",
  "Transport feasibility",
  "Service area map",
  "NDIS-aware request intake",
  "Listing quality score",
  "Demand heatmap",
  "Venue/clinic accessibility check",
];

export default function ProviderGrowthPage() {
  return (
    <MapAbleCareMarketingShell>
      <div className="bg-white text-[#0C1833]">
        <section className="border-b border-slate-200 bg-[#F6FBFC]">
          <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
            <h1 className="max-w-4xl text-4xl font-black tracking-[-0.04em] md:text-5xl">
              Grow by being useful, trusted, and accessible.
            </h1>
            <p className="mt-4 max-w-3xl text-lg text-slate-600">
              Explore how reliable service details, communication access and reviewable evidence could
              support informed provider choices. Feature availability varies by release.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-12 px-5 py-12 lg:px-8">
          <section aria-labelledby="tools-heading">
            <h2 id="tools-heading" className="text-2xl font-black">
              Proposed provider tools
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <li key={tool} className="rounded-2xl border border-slate-200 p-4 font-semibold">
                  {tool}
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="dashboard-heading"
            className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-6"
          >
            <h2 id="dashboard-heading" className="text-2xl font-black">
              Provider dashboard information — not connected
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              <Stat term="Enquiries (30 days)" detail="Not reported" />
              <Stat term="Median response time" detail="Not measured" />
              <Stat term="Availability status" detail="Not verified" />
              <Stat term="Profile completeness" detail="Not assessed" />
              <Stat term="Access info completeness" detail="Not assessed" />
              <Stat term="Conversion to first appointment" detail="Not measured" />
              <Stat term="Upcoming reassessment" detail="Not scheduled" />
            </dl>
          </section>

          <section aria-labelledby="pricing-heading">
            <h2 id="pricing-heading" className="text-2xl font-black">
              Potential provider services
            </h2>
            <ul className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                "Free listing",
                "Verified profile",
                "Access-ready badge",
                "Qualified introductions",
                "Provider analytics",
              ].map((plan) => (
                <li key={plan} className="rounded-2xl border border-slate-200 p-4 font-semibold">
                  {plan}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-slate-600" role="note">
              These are possible service options, not confirmed prices or activated subscriptions.
              Any future fees must remain separate from independent access assessment results.
            </p>
          </section>

          <section aria-labelledby="enquiry-heading" className="rounded-2xl border border-slate-200 p-5">
            <h2 id="enquiry-heading" className="text-xl font-black">
              Provider enquiry form
            </h2>
            <form className="mt-4 grid gap-3 md:grid-cols-2" action="/contact">
              <div>
                <label htmlFor="org" className="text-sm font-semibold">
                  Organisation
                </label>
                <input
                  id="org"
                  name="organisation"
                  required
                  className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
                />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-semibold">
                  Work email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="message" className="text-sm font-semibold">
                  What do you need help with?
                </label>
                <textarea
                  id="message"
                  name="message"
                  className="mt-1 min-h-28 w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <button
                type="submit"
                className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-5 text-sm font-black text-white ${mapableCareFocusRing}`}
              >
                Send enquiry
              </button>
            </form>
            <p className="mt-3 text-sm">
              Or{" "}
              <Link href="/for-providers" className="font-semibold text-[#005B7F] underline">
                register provider interest
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </MapAbleCareMarketingShell>
  );
}

function Stat({ term, detail }: { term: string; detail: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{term}</dt>
      <dd className="mt-1 text-lg font-black">{detail}</dd>
    </div>
  );
}
