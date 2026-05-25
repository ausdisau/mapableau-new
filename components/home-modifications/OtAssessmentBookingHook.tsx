import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";

export function OtAssessmentBookingHook({
  requestId,
  assessorName,
  scheduledAt,
}: {
  requestId: string;
  assessorName?: string;
  scheduledAt?: Date | string | null;
}) {
  return (
    <MapAbleCard
      title="OT / access assessment"
      description="Links to therapy appointment booking when assessment is required."
    >
      {scheduledAt ? (
        <p className="text-sm">
          Assessment booked with {assessorName ?? "assessor"} on{" "}
          {new Date(scheduledAt).toLocaleString()}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          No assessment booked yet for request {requestId.slice(0, 8)}…
        </p>
      )}
    </MapAbleCard>
  );
}
