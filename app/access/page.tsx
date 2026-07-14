import {
  ModuleCanvasExtras,
  ModuleCanvasSection,
} from "@/components/canvas/ModuleCanvasSection";
import { PublicModulePage } from "@/components/marketing/PublicModulePage";

export const metadata = {
  title: "MapAble Access | Accessibility map",
  description:
    "Learn how MapAble Access will separate community accessibility reviews from formal accreditation claims.",
};

export default function AccessPage() {
  return (
    <>
    <PublicModulePage
      eyebrow="MapAble Access"
      title="Accessibility information for places, reviewed with care."
      description="MapAble Access is planned as a public accessibility map with structured community reviews, venue claim flows and separate formal accreditation workflows."
      whoFor={[
        "Participants and families planning accessible outings.",
        "Venue owners improving and explaining access features.",
        "Community reviewers sharing structured, moderated observations.",
      ]}
      availableNow={[
        "Public explanation of the Access module and review principles.",
        "Pilot path for venue and community interest.",
        "Clear separation between community reviews and accreditation.",
        "Interactive access map with in-marker ratings and comments.",
      ]}
      comingSoon={[
        "Expanded place coverage and accreditation workflows.",
        "KML importer and venue claim improvements.",
      ]}
      safetyNote="Community reviews are not legal, DDA or building compliance determinations. Formal MapAble Accreditation will be separate from community reviews and will not be implied by map feedback."
      primaryCta={{ label: "Open access map", href: "/access/map" }}
      secondaryCta={{ label: "Contact MapAble", href: "/contact" }}
    />
    <ModuleCanvasSection module="access" />
    <ModuleCanvasExtras module="access" showDigitalTwin />
    </>
  );
}
