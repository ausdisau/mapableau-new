"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  mapablePublicPageContainerClass,
  mapablePublicSectionTitleClass,
} from "@/lib/marketing/public-page-styles";
import { getPublicModuleRelatedLinks } from "@/lib/marketing/site-navigation";

export function PublicModuleRelatedSection() {
  const pathname = usePathname() ?? "/";
  const items = getPublicModuleRelatedLinks(pathname);

  return (
    <section className="border-t border-slate-200 bg-slate-50">
      <div className={`${mapablePublicPageContainerClass} py-10 sm:py-12`}>
        <p className={mapablePublicSectionTitleClass}>Explore MapAble</p>
        <h2 className="mapable-display mt-2 text-xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-2xl">
          Related modules and entry points
        </h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#3B5BDB] transition hover:border-[#3B5BDB]/30 hover:bg-[#F7F8FC] focus:outline-none focus:ring-4 focus:ring-[#F26A21]/40"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
