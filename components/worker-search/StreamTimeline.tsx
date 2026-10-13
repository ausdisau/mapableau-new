import { Badge } from "@/components/ui/badge";
import {
  type WorkerSearchStreamEvent,
  type WorkerSearchStreamStage,
} from "@/lib/search/worker-search-types";

const STAGE_LABELS: Record<WorkerSearchStreamStage, string> = {
  received_query: "Received",
  parsed_filters: "Parsed filters",
  fetched_workers: "Workers found",
  fetched_providers: "Providers found",
  ranking_candidates: "Ranking",
  finalized_results: "Complete",
};

export function StreamTimeline({ events }: { events: WorkerSearchStreamEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        Matching updates will appear here after you send a prompt.
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
