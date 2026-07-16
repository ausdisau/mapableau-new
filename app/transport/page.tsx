import { ModuleCanvasSection } from "@/components/canvas/ModuleCanvasSection";
import { PublicModulePage } from "@/components/marketing/PublicModulePage";
import { buildTransportFeaturesResponse } from "@/lib/transport/production-claims";

export const metadata = {
  title: "MapAble Transport | Accessible travel",
  description:
    "Learn how MapAble Transport will support accessible trip requests, dispatch eligibility and consent-aware travel records.",
};

export default function TransportHubPage() {
  const features = buildTransportFeaturesResponse();

  return (
    <>
      <PublicModulePage
        eyebrow="MapAble Transport"
        title="Accessible trip requests with safety and eligibility checks."
        description="MapAble Transport is planned for accessible journeys, provider dispatch, driver field views and participant confirmation while keeping exact address details restricted to authorised people."
        whoFor={[
          "Participants arranging accessible travel and community access.",
          "Transport providers coordinating drivers and suitable vehicles.",
          "Drivers who need clear, need-to-know trip instructions.",
        ]}
        availableNow={features.availableNow}
        pilotOrSandbox={features.pilotOrSandbox.slice(0, 6)}
        comingSoon={features.comingNext}
        partnerRequired={features.partnerRequired}
        safetyNote="Exact pickup and drop-off details will only be visible to authorised providers and assigned drivers. Route estimates are advisory and transport dispatch will require driver and vehicle eligibility checks. In immediate danger, call 000 — MapAble is not an emergency service."
        primaryCta={{
          label: "Find transport providers",
          href: "/providers?service=transport",
        }}
        secondaryCta={{ label: "Register as provider", href: "/for-providers" }}
      />
      <ModuleCanvasSection module="transport" />
    </>
  );
}
