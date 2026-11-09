import { AccessSignalsShell } from "@/components/access-signals/AccessSignalsShell";
import { ExploreAccessView } from "@/components/access-signals/ExploreAccessView";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Access Signals — illustrative workspace | MapAble",
  description:
    "Explore fictional accessibility examples. No live place assessment or published rating is provided.",
};

export default function AccessSignalsExplorePage() {
  return (
    <AccessSignalsShell activePath="/access-signals">
      <ExploreAccessView />
    </AccessSignalsShell>
  );
}
