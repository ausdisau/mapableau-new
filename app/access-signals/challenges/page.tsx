import { AccessSignalsShell } from "@/components/access-signals/AccessSignalsShell";
import { CommunityChallengesView } from "@/components/access-signals/CommunityChallengesView";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Community Mapping Challenges (synthetic demo) | MapAble Signal",
  description:
    "Explore fictional, participant-led accessibility mapping challenges. No live campaigns, evidence submission or public ratings.",
};

export default function CommunityMappingChallengesPage() {
  return (
    <AccessSignalsShell activePath="/access-signals/challenges">
      <CommunityChallengesView />
    </AccessSignalsShell>
  );
}
