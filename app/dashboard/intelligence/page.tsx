import { CareIntelligenceCockpit } from "@/components/intelligence/CareIntelligenceCockpit";
import { PlatformIntelligenceMap } from "@/components/intelligence/PlatformIntelligenceMap";
import {
  careIntelligenceConfigFromEnv,
  careIntelligenceHealth,
} from "@/lib/care-intelligence/config";
import {
  listPlatformIntelligenceDomains,
  listPlatformJourneyGraphs,
} from "@/lib/care-intelligence/platform-registry";
import { listScenarioSummaries } from "@/lib/care-intelligence/scenarios";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Platform Intelligence Lab | MapAble Core",
};

export default function CareIntelligencePage() {
  const health = careIntelligenceHealth(careIntelligenceConfigFromEnv());
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">
          MapAble Labs · Participant-controlled intelligence
        </p>
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">
          MapAble Platform Intelligence Lab
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Explore one participant-controlled kernel across Care, Transport,
          Employment, Foods and Rehabilitation. Only Care &amp; Support
          currently has a runnable synthetic kernel; the additional domain packs
          are implementation-ready designs with the same no-execution boundary.
        </p>
      </header>
      <PlatformIntelligenceMap
        domains={listPlatformIntelligenceDomains()}
        journeyGraphs={listPlatformJourneyGraphs()}
      />
      <CareIntelligenceCockpit
        health={health}
        scenarios={listScenarioSummaries()}
      />
    </div>
  );
}
