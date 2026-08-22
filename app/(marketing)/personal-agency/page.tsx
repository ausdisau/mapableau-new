import Link from "next/link";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export const metadata = {
  title: "My MapAble | Personal agency",
  description:
    "Participant-controlled workspace bringing accessibility information and everyday planning together — under your control.",
};

export default function PersonalAgencyPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
        Being developed
      </p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-[#0C1833]">
        My MapAble
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        Your life, choices, supports and accessibility — under your control.
      </p>

      <section className="mt-10 space-y-4" aria-labelledby="what-it-is">
        <h2 id="what-it-is" className="text-2xl font-bold">
          What it is
        </h2>
        <p className="text-slate-700 leading-7">
          MapAble is developing a participant-controlled workspace designed to bring
          accessibility information and everyday planning together. Available features depend
          on programme availability and controlled pilots — not everything described here is live
          yet.
        </p>
      </section>

      <section className="mt-10 space-y-4" aria-labelledby="you-stay-in-control">
        <h2 id="you-stay-in-control" className="text-2xl font-bold">
          You stay in control
        </h2>
        <p className="text-slate-700 leading-7">
          MapAble can help search, compare and organise options. It does not make personal
          decisions for you. Consequential actions — contacting organisations, sharing sensitive
          information, bookings, or spending money — require your explicit approval.
        </p>
      </section>

      <section className="mt-10 space-y-4" aria-labelledby="public-stays-public">
        <h2 id="public-stays-public" className="text-2xl font-bold">
          Public MapAble stays public
        </h2>
        <p className="text-slate-700 leading-7">
          You do not need an account to view public accessibility information, explore places, or
          read guides on mapable.com.au.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/register"
          className={`inline-flex min-h-11 items-center rounded-lg bg-[#F8C51C] px-5 py-2 text-sm font-bold text-[#0C1833] ${mapableCareFocusRing}`}
        >
          Create My MapAble
        </Link>
        <Link
          href="/access"
          className={`inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold ${mapableCareFocusRing}`}
        >
          Explore accessibility
        </Link>
      </div>
    </article>
  );
}
