import Link from "next/link";

import { AskMapAbleTrigger } from "@/components/marketing/mapable/AskMapAbleTrigger";
import { MapAbleButton } from "@/components/marketing/mapable/MapAbleButton";
import { SafetyNotice } from "@/components/marketing/mapable/trust/SafetyNotice";

export function ProviderFinderNoResults() {
  return (
    <div
      className="rounded-2xl border border-slate-200 bg-white p-8 text-center"
      role="status"
    >
      <h3 className="mapable-display text-lg font-semibold text-mapable-navy">
        No providers matched your search
      </h3>
      <p className="mapable-soft mt-2 text-sm text-slate-600">
        Try broadening your location, choosing &quot;Any funding type&quot;, or removing an
        access filter. You can also ask MapAble for guidance — we will not share your details
        without your confirmation.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <AskMapAbleTrigger context="provider-finder-no-results" />
        <MapAbleButton href="/provider-finder" variant="outline">
          Clear and browse all
        </MapAbleButton>
      </div>
      <SafetyNotice>
        <p className="mt-4 text-left">
          Need human help? Email{" "}
          <a href="mailto:support@mapable.com.au" className="text-mapable-blue underline">
            support@mapable.com.au
          </a>{" "}
          or call{" "}
          <a href="tel:+61434083624" className="text-mapable-blue underline">
            0434 083 624
          </a>
          .{" "}
          <Link href="/register" className="text-mapable-blue underline">
            List your service
          </Link>{" "}
          if you are a provider.
        </p>
      </SafetyNotice>
    </div>
  );
}
