import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formInputClass } from "@/components/forms/AccessibleFormField";
import type {
  ShiftCreatorDraft,
  ShiftCreatorStreamResult,
} from "@/lib/care/shift-creator/types";

type Props = {
  result: ShiftCreatorStreamResult | null;
  selectedWorkerId: string;
  onWorkerChange: (workerId: string) => void;
  onConfirm: () => void;
  confirming: boolean;
  confirmMessage: string | null;
  confirmError: string | null;
};

export function ShiftDraftCard({
  result,
  selectedWorkerId,
  onWorkerChange,
  onConfirm,
  confirming,
  confirmMessage,
  confirmError,
}: Props) {
  if (!result) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Send a message to generate a shift draft.
      </p>
    );
  }

  const { draft, warnings, suggestedActions, ambiguousBookings, availableWorkers } =
    result;

  const workerId = selectedWorkerId || draft.workerProfileId || "";
  const canConfirm = Boolean(draft.careBookingId) && Boolean(workerId);

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle className="text-base">Shift draft</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {draft.bookingTitle ? (
          <p className="text-sm">
            <span className="font-medium">Booking:</span> {draft.bookingTitle}
          </p>
        ) : null}

        {draft.careBookingId ? (
          <p className="text-xs text-muted-foreground">ID: {draft.careBookingId}</p>
        ) : null}

        {draft.startAt ? (
          <p className="text-sm">
            <span className="font-medium">When:</span>{" "}
            {new Date(draft.startAt).toLocaleString()} –{" "}
            {new Date(draft.endAt).toLocaleString()}
          </p>
        ) : null}

        {draft.location ? (
          <p className="text-sm">
            <span className="font-medium">Location:</span> {draft.location}
          </p>
        ) : null}

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Eligibility:</span>
          <Badge variant={draft.eligibility.ok ? "default" : "destructive"}>
            {draft.eligibility.ok ? "Ready" : draft.eligibility.message ?? "Check worker"}
          </Badge>
        </div>

        {availableWorkers && availableWorkers.length > 0 ? (
          <div className="space-y-2">
            <label htmlFor="shift-worker-select" className="text-sm font-medium">
              Worker
            </label>
            <select
              id="shift-worker-select"
              className={formInputClass}
              value={workerId}
              onChange={(e) => onWorkerChange(e.target.value)}
            >
              <option value="">Select worker</option>
              {availableWorkers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.displayName}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {ambiguousBookings && ambiguousBookings.length > 0 ? (
          <div className="rounded-lg border border-dashed p-3 text-sm">
            <p className="mb-2 font-medium">Possible bookings</p>
            <ul className="space-y-1">
              {ambiguousBookings.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/provider/care/shift-creator?careBookingId=${encodeURIComponent(b.id)}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {b.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {warnings.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : null}

        {suggestedActions.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {suggestedActions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        ) : null}

        <Button
          type="button"
          variant="default"
          disabled={!canConfirm || confirming}
          loading={confirming}
          onClick={onConfirm}
        >
          Confirm and assign worker
        </Button>

        {confirmMessage ? (
          <p className="text-sm text-muted-foreground" role="status">
            {confirmMessage}{" "}
            {draft.careBookingId ? (
              <Link
                href={`/provider/care/bookings/${draft.careBookingId}`}
                className="text-primary underline"
              >
                View booking
              </Link>
            ) : null}
          </p>
        ) : null}
        {confirmError ? (
          <p className="text-sm text-destructive" role="alert">
            {confirmError}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
