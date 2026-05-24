import Link from "next/link";

import { MapAbleButton } from "@/components/marketing/mapable/MapAbleButton";
import { SectionEyebrow } from "@/components/marketing/mapable/SectionEyebrow";

export function ProviderFinderListServiceCta() {
  return (
    <section
      className="border-t border-slate-200 bg-mapable-soft py-14"
      aria-labelledby="list-service-heading"
    >
      <div className="container mx-auto max-w-3xl px-4 text-center">
        <SectionEyebrow>For providers</SectionEyebrow>
        <h2
          id="list-service-heading"
          className="mapable-display mt-2 text-2xl font-bold text-mapable-navy"
        >
          List your service on MapAble
        </h2>
        <p className="mapable-soft mt-3 text-slate-600">
          Reach participants looking for care, transport, therapy and employment support with
          access and funding context visible up front.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <MapAbleButton href="/register" variant="primary">
            List your service
          </MapAbleButton>
          <Link
            href="/ask"
            className="mapable-focus-ring inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-mapable-blue hover:underline"
          >
            Questions? Ask MapAble
          </Link>
        </div>
      </div>
    </section>
  );
}
