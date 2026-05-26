import { CopilotPanel } from "@/components/copilot/CopilotPanel";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Ask MapAble | MapAble",
  description:
    "Accessible Co-Pilot guidance with participant-controlled PRMS records underneath.",
};

export default function AskPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <Badge
        variant="outline"
        className="mb-4 border-primary/20 bg-primary/5 text-primary"
      >
        Co-Pilot + PRMS
      </Badge>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Ask MapAble
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Friendly guidance on the surface. Participant records, consent checks,
        and evidence underneath.
      </p>
      <div className="mt-8">
        <CopilotPanel />
      </div>
    </div>
  );
}
