import { Badge } from "@/components/ui/badge";
import {
  type NeedsAssessmentStreamEvent,
  type NeedsAssessmentStreamStage,
} from "@/lib/participant-needs/types";

const STAGE_LABELS: Record<NeedsAssessmentStreamStage, string> = {
  received_query: "Started",
  loaded_profile: "Profile loaded",
  analysed_domains: "Domains reviewed",
  identified_gaps: "Gaps identified",
  recommendations: "Recommendations",
  finalized: "Complete",
};

export function NeedsAssessmentTimeline({
  events,
}: {
  events: NeedsAssessmentStreamEvent[];
}) {
  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        Assessment progress will appear here after you start.
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {events.map((event, index) => (
        <li
          key={`${event.stage}-${index}`}
          className="rounded-lg border bg-card p-3 text-sm"
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <Badge variant="outline">{STAGE_LABELS[event.stage]}</Badge>
            <span className="text-xs text-muted-foreground">Step {index + 1}</span>
          </div>
          <p>{event.message}</p>
        </li>
      ))}
    </ol>
  );
}
