import React from "react";

import { homepagePurposePair } from "@/lib/marketing/mapable-care-combined-data";

/**
 * AFDO-inspired vision/mission pair: two calm statement cards under pathways.
 */
export function HomepagePurposePair() {
  return (
    <section
      aria-label="MapAble focus and commitment"
      className="border-b border-slate-200 bg-[#F7F8FC]"
    >
      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-12 sm:grid-cols-2 lg:gap-8 lg:px-8 lg:py-14">
        {homepagePurposePair.map((item) => (
          <article
            key={item.title}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <h2 className="text-xl font-black tracking-[-0.03em] text-[#3B5BDB]">
              {item.title}
            </h2>
            <p className="mt-3 text-base leading-7 text-[#0C1833]">
              {item.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
