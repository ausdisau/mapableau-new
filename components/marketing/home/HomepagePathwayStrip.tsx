import Link from "next/link";
import React from "react";

import { homepagePathwayTiles } from "@/lib/marketing/mapable-care-combined-data";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

/**
 * PWDA-inspired 3-up pathway band: large solid tiles for the next action.
 * MapAble navy/orange — destinations unchanged.
 */
export function HomepagePathwayStrip() {
  return (
    <section aria-label="Start here" className="bg-[#0C1833]">
      <div className="mx-auto grid max-w-7xl gap-px bg-[#0C1833]/40 sm:grid-cols-3">
        {homepagePathwayTiles.map((tile, index) => (
          <Link
            key={tile.href}
            href={tile.href}
            className={`group flex min-h-[11rem] flex-col justify-between bg-[#0C1833] px-6 py-8 transition hover:bg-[#142447] ${mapableCareFocusRing}`}
          >
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F26A21]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-white">
                {tile.label}
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-white/75">
                {tile.body}
              </p>
            </div>
            <span
              aria-hidden="true"
              className="mt-6 inline-flex text-lg font-black text-[#F26A21] transition group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
