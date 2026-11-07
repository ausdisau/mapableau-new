import { AccessSignalsShell } from "@/components/access-signals/AccessSignalsShell";
import { ExploreAccessView } from "@/components/access-signals/ExploreAccessView";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Access Signals (synthetic demo) | MapAble",
  description:
    "Synthetic Access Signals explore demo — not a real place and not published ratings.",
};

export default function AccessSignalsExplorePage() {
  return (
    <AccessSignalsShell activePath="/access-signals">
      <ExploreAccessView />
    </AccessSignalsShell>
  );
}
