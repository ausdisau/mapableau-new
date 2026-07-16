import { ModuleCanvasSection } from "@/components/canvas/ModuleCanvasSection";
import { PublicModulePage } from "@/components/marketing/PublicModulePage";

export const metadata = {
  title: "MapAble Transport | Accessible travel",
  description:
    "Accessible trip requests, dispatch eligibility checks, trip status updates and advisory route estimates for disability-aware transport.",
};

export default function TransportHubPage() {
  return (
    <>
    <PublicModulePage
      eyebrow="MapAble Transport"
      title="Accessible trip requests with safety and eligibility checks."
      description="MapAble Transport supports accessible journeys, provider dispatch, driver field views and participant confirmation while keeping exact address details restricted to authorised people."
      whoFor={[
        "Participants arranging accessible travel and community access.",
        "Transport providers coordinating drivers and suitable vehicles.",
        "Drivers who need clear, need-to-know trip instructions.",
      ]}
      availableNow={[
        "Public explanation of the transport safety model.",
        "Provider finder entry point for transport-related searches.",
        "Signed-in pilot routes for transport requests and trip history.",
        "Driver and vehicle verification before dispatch.",
        "Trip status updates, evidence capture and participant review.",
        "Routing adapter support where estimates remain advisory.",
      ]}
      comingSoon={[
        "Live GPS tracking and guaranteed arrival times.",
      ]}
      safetyNote="Exact pickup and drop-off details are only visible to authorised providers and assigned drivers. Route estimates are advisory. Transport dispatch requires driver and vehicle eligibility checks."
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
