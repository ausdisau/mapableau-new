import type { Metadata } from "next";

import { CareProviderMapExplorer } from "@/components/care/CareProviderMapExplorer";
import { canonicalAlternate } from "@/lib/config/canonical-url";

export const metadata: Metadata = {
  title: "Disability care and support provider map | MapAble Care",
  description:
    "Browse imported NDIS Provider Finder records on an accessible OpenStreetMap/Leaflet map, with matching provider list and source information.",
  alternates: canonicalAlternate("/care/provider-map"),
};

export default function CareProviderMapPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-8 px-5 py-8 text-[#0C1833] lg:px-8">
      <header className="space-y-3">
        <p className="text-sm font-black uppercase tracking-[0.15em] text-[#005B7F]">
          MapAble Care
        </p>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">
          Find disability care and support providers
        </h1>
        <p className="max-w-3xl text-lg text-slate-700">
          Explore providers by location and NDIS registration group. Compare
          directory evidence before contacting a service. You choose whom to
          contact; the map does not rank people or approve workers.
        </p>
      </header>
      <CareProviderMapExplorer />
    </main>
  );
}
