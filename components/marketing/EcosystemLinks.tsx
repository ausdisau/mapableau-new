import Link from "next/link";

import { getVerticalById, getVerticalsByIds } from "@/lib/mapable/verticals";
import {
  mapablePublicPageContainerClass,
  mapablePublicSectionTitleClass,
} from "@/lib/marketing/public-page-styles";

export type EcosystemLinksProps = {
  currentVerticalId: string;
  linkedVerticalIds: string[];
  heading?: string;
  intro?: string;
};

export function EcosystemLinks({
  currentVerticalId,
  linkedVerticalIds,
  heading = "Connected MapAble services",
  intro = "This module strengthens the wider MapAble ecosystem — not a standalone app.",
}: EcosystemLinksProps) {
  const current = getVerticalById(currentVerticalId);
  const linked = getVerticalsByIds(linkedVerticalIds).filter(
    (v) => v.id !== currentVerticalId,
  );

  if (linked.length === 0) return null;

  return (
    <section className="border-t border-slate-200 bg-slate-50">
      <div className={`${mapablePublicPageContainerClass} py-10 sm:py-12`}>
        <p className={mapablePublicSectionTitleClass}>MapAble ecosystem</p>
        <h2 className="mapable-display mt-2 text-xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-2xl">
          {heading}
        </h2>
        {intro ? (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{intro}</p>
        ) : null}
        {current ? (
          <p className="mt-2 text-xs text-slate-500">
            You are viewing: <strong>{current.name}</strong>
          </p>
        ) : null}
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {linked.map((vertical) => (
            <li key={vertical.id} className="list-none">
              <Link
                href={vertical.href}
                className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[#005B7F]/30 hover:bg-[#F6FBFC] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              >
                <span className="text-sm font-black text-[#005B7F]">
                  {vertical.shortName}
                </span>
                <p className="mt-1 text-sm leading-6 text-slate-600">{vertical.oneLine}</p>
                <span className="mt-2 inline-block text-xs font-bold text-[#005B7F]">
                  Learn more →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
