import Link from "next/link";

import { canonicalAlternate } from "@/lib/config/canonical-url";
import { exploreServiceCatalogue } from "@/lib/marketing/mapable-care-combined-data";
import {
  mapablePublicPageContainerClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";

export const metadata = {
  title: "Explore MapAble | MapAble",
  description:
    "See which MapAble services are available now and which are still in development.",
  alternates: canonicalAlternate("/explore"),
};

export default function ExploreMapAblePage() {
  return (
    <div className="bg-white text-[#0C1833]">
      <section className="border-b border-slate-200 bg-[#F6FBFC]">
        <div className={`${mapablePublicPageContainerClass} py-14 sm:py-20`}>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#005B7F]">
            Explore MapAble
          </p>
          <h1 className={`${mapablePublicTitleClass} mt-3 max-w-3xl`}>
            Information, services and communities
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Each area below says whether it is available now or still in
            development. Public pages explain the work. They do not open general
            bookings, live matching, marketplace checkout, or NDIS claims.
          </p>
        </div>
      </section>
      <section className={`${mapablePublicPageContainerClass} py-12`}>
        <ul className="grid gap-5 md:grid-cols-2">
          {exploreServiceCatalogue.map((service) => (
            <li
              key={service.title}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <p className="text-sm font-black text-[#005B7F]">
                {service.statusLabel}
              </p>
              <h2 className="mt-2 text-xl font-black">{service.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {service.body}
              </p>
              <Link
                href={service.href}
                className="mt-4 inline-flex min-h-11 items-center font-black text-[#005B7F] underline-offset-4 hover:underline focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              >
                Open {service.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
