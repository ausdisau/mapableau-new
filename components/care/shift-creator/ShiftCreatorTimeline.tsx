import { Badge } from "@/components/ui/badge";
import type {
  ShiftCreatorStreamEvent,
  ShiftCreatorStreamStage,
} from "@/lib/care/shift-creator/types";

const STAGE_LABELS: Record<ShiftCreatorStreamStage, string> = {
  received_query: "Received",
  resolved_booking: "Booking",
  parsed_shift_details: "Schedule",
  matched_worker: "Worker",
  checked_eligibility: "Eligibility",
  draft_ready: "Draft",
  finalized: "Complete",
};

export function ShiftCreatorTimeline({
  events,
}: {
  events: ShiftCreatorStreamEvent[];
}) {
  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        Planning steps will appear here after you send a message.
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
